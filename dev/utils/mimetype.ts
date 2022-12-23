interface Signatures {
    [key: string]: string
};

const signatures: Signatures = {
    JVBERi0: 'pdf',
    R0lGODdh: 'gif',
    R0lGODlh: 'gif',
    iVBORw0KGgo: 'png',
    '/9j/': 'jpg'
};

export function detectMimeType(b64: string) {
  for (const s in signatures) {
    if (b64.indexOf(s) === 0) {
      return signatures[s];
    }
  }
}