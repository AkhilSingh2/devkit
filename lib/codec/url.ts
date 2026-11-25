export function encodeUrlComponent(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrlComponent(input: string): string {
  return decodeURIComponent(input.replaceAll("+", " "));
}

export function encodeUrl(input: string): string {
  return encodeURI(input);
}

export function decodeUrl(input: string): string {
  return decodeURI(input);
}

export function encodeForm(input: string): string {
  return encodeURIComponent(input).replaceAll("%20", "+");
}
