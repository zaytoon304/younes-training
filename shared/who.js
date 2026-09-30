/* =====================================================================
   هوية المتدرب في منصة جذور: الاسم + كلمة سر (مرة واحدة على الجوال)
   يحتاج: firebase-app-compat + firebase-auth-compat + firebase-firestore-compat + live.js
   - الحساب في Firebase Authentication: بريد داخلي مشتق من الاسم + كلمة السر التي يختارها المتدرب،
     فلا يستطيع أحد التصويت باسم زميله دون معرفة كلمة سره (يتحقق الخادم منها، لا الجوال).
   - البيانات في Firestore:
       courses/{دورة}/trainees/{uid}              ← { name, school, ts }
       courses/{دورة}/trainees/{uid}/items/{مفتاح} ← الإجابة (تُكتب مرة واحدة ولا تُعدّل)
     لا يقرأها إلا صاحبها والمدرب (انظر firestore.rules).
   ===================================================================== */
(function () {
const $ = s => document.querySelector(s);
/* توحيد الاسم: حذف التشكيل والتطويل، وتوحيد الألف والياء، والمسافات */
const norm = n => String(n || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي')
  .replace(/\s+/g, ' ').trim();
async function sha(t) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

const WHO = window.WHO = {
  course: null, user: null, name: '',
  auth() { return firebase.auth(); },
  db() { return firebase.firestore(); },
  me() { return this.db().collection('courses').doc(this.course).collection('trainees').doc(this.user.uid); },

  /* يعرض نموذج الدخول داخل عنصر، ويعيد وعدًا يُحل بعد الدخول */
  ensure(course, box) {
    this.course = course;
    return new Promise(resolve => {
      const un = this.auth().onAuthStateChanged(async u => {
        un();
        if (u && (u.email || '').endsWith('@juthoor.app')) {   // حساب متدرب (حساب المدرب لا يُستخدم للتصويت)
          this.user = u;
          try { const d = await this.me().get(); this.name = d.exists ? d.data().name : ''; } catch (e) {}
          if (this.name) { this.badge(); return resolve(u); }
        }
        this.form(box, resolve);
      });
    });
  },

  form(box, resolve) {
    box.hidden = false;
    box.innerHTML = `<div class="kick">👤 تعريف المتدرب</div>
      <h1>اكتب اسمك وكلمة سرك</h1>
      <p style="margin-bottom:12px">مرة واحدة فقط على هذا الجوال. احفظ كلمة السر: ستحتاجها لو غيّرت جوالك، ولا يستطيع أحد التصويت باسمك بدونها.</p>
      <label class="fld"><span>الاسم الثلاثي</span><input id="w-name" autocomplete="name" placeholder="مثال: محمد أحمد العتيبي"></label>
      <label class="fld"><span>المدرسة</span><input id="w-school" placeholder="اسم مدرستك"></label>
      <label class="fld"><span>كلمة السر (٦ أحرف أو أرقام على الأقل)</span><input id="w-pass" type="password" autocomplete="current-password"></label>
      <p class="werr" id="w-err" hidden></p>
      <button class="send" id="w-go">دخول</button>`;
    const err = m => { const e = $('#w-err'); e.textContent = m; e.hidden = !m; };
    $('#w-go').onclick = async () => {
      const name = norm($('#w-name').value), school = $('#w-school').value.trim(), pass = $('#w-pass').value;
      if (name.split(' ').length < 2) return err('اكتب اسمك الثلاثي (كلمتان على الأقل)');
      if (pass.length < 6) return err('كلمة السر ٦ أحرف أو أرقام على الأقل');
      err(''); const b = $('#w-go'); b.disabled = true; b.textContent = 'جارٍ الدخول…';
      const email = 't' + (await sha('juthoor|' + name)).slice(0, 28) + '@juthoor.app';
      try {
        let cred;
        try { cred = await this.auth().createUserWithEmailAndPassword(email, pass); }
        catch (e) {
          if (e.code !== 'auth/email-already-in-use') throw e;
          cred = await this.auth().signInWithEmailAndPassword(email, pass);
        }
        this.user = cred.user; this.name = name;
        await this.me().set({ name, school: school.slice(0, 80), ts: Date.now() });
        box.hidden = true; this.badge(); resolve(cred.user);
      } catch (e) {
        b.disabled = false; b.textContent = 'دخول';
        err(/wrong-password|invalid-credential|invalid-login/.test(e.code || '')
          ? 'هذا الاسم مسجّل من قبل بكلمة سر أخرى. إن كان اسمك فاكتب كلمة سرك الصحيحة، وإن كان اسم زميل يشبهك فأضف اسم عائلتك أو اسمًا رابعًا.'
          : 'تعذّر الدخول، تحقق من الإنترنت وحاول مجددًا');
      }
    };
  },

  /* شريط صغير بالاسم + «لست أنا» (للجوال المشترك) */
  badge() {
    if ($('.whoami')) return;
    const h = $('header');
    if (!h) return;
    h.insertAdjacentHTML('afterend', `<div class="whoami">👤 ${this.name} <button id="w-out">لست ${this.name.split(' ')[0]}؟</button></div>`);
    $('#w-out').onclick = () => this.auth().signOut().then(() => location.reload());
  },

  /* تسجيل إجابة مرة واحدة فقط (أول إجابة هي المعتمدة) */
  async get(key) { const d = await this.me().collection('items').doc(key).get(); return d.exists ? d.data() : null; },
  record(key, data) { return this.me().collection('items').doc(key).set(Object.assign({}, data, { ts: Date.now() })); },
  async items() {
    const s = await this.me().collection('items').get(), o = {};
    s.forEach(d => o[d.id] = d.data());
    return o;
  },
};
})();
