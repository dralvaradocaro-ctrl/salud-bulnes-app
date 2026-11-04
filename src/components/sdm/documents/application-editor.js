import { formatApplicationValue, toggleApplicationOption, updateApplicationValue } from './application';

// Parent-owned listeners keep the iframe inert and avoid reloading it while typing.
export function bindApplicationEditor(doc, initialValues, onChange) {
  let values = initialValues;
  function sync(next, active) {
    values = next;
    for (const element of doc.querySelectorAll('[data-field]')) {
      const key = element.dataset.field;
      if (element.dataset.option !== undefined) {
        const selected = Array.isArray(values[key]) ? values[key].includes(element.dataset.option) : values[key] === element.dataset.option;
        element.textContent = selected ? 'X' : ' ';
        element.setAttribute('aria-pressed', String(selected));
      } else if (element !== active) {
        if (element.hasAttribute('contenteditable')) element.textContent = values[key] || '';
        else element.value = values[key] || '';
      }
    }
    for (const element of doc.querySelectorAll('[data-print-field]')) {
      element.textContent = formatApplicationValue(element.dataset.printField, values[element.dataset.printField]);
    }
    onChange(values);
  }
  function input(event) {
    const element = event.target.closest('[data-field]');
    if (!element || element.dataset.option !== undefined || event.isComposing) return;
    const value = element.hasAttribute('contenteditable') ? element.textContent : element.value;
    const next = updateApplicationValue(values, element.dataset.field, value);
    if (element.hasAttribute('contenteditable') && next[element.dataset.field] !== value) {
      element.textContent = next[element.dataset.field];
      const range = doc.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      doc.getSelection().removeAllRanges();
      doc.getSelection().addRange(range);
    }
    sync(next, element);
  }
  function click(event) {
    const button = event.target.closest('[data-option]');
    if (button) sync(toggleApplicationOption(values, button.dataset.field, button.dataset.option));
  }
  function paste(event) {
    const element = event.target.closest('[contenteditable]');
    if (!element) return;
    event.preventDefault();
    const selection = doc.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const text = doc.createTextNode(event.clipboardData.getData('text/plain'));
    range.insertNode(text);
    range.setStartAfter(text);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    input({ target: element });
  }
  doc.addEventListener('input', input);
  doc.addEventListener('change', input);
  doc.addEventListener('compositionend', input);
  doc.addEventListener('click', click);
  doc.addEventListener('paste', paste);
  return () => {
    doc.removeEventListener('input', input);
    doc.removeEventListener('change', input);
    doc.removeEventListener('compositionend', input);
    doc.removeEventListener('click', click);
    doc.removeEventListener('paste', paste);
  };
}
