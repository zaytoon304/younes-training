/* English labels for the shared code-slide widget (its UI text is Arabic by default) */
(window.DECK_HOOKS = window.DECK_HOOKS || []).push(sl => {
  sl.querySelectorAll('.copy').forEach(b => { b.textContent = '📋 Copy code'; });
  sl.querySelectorAll('.xstart').forEach(x => { x.textContent = 'Press “Next” to write the first line ✍️'; });
});
/* Shared widgets sometimes print Arabic-Indic digits (step numbers): show Latin digits in English decks */
window.DECK_HOOKS.push(sl => {
  const w = document.createTreeWalker(sl, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode; if (/[٠-٩]/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); }
});
