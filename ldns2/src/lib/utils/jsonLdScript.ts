/**
 * Serialize data as an inline JSON-LD <script> tag for {@html} injection.
 *
 * JSON.stringify does not escape "<", so a string value containing
 * "</script>" would close the tag and inject markup. Some JSON-LD here
 * includes remote data (registrar names from RDAP, record values), which
 * must never be able to do that. Escaping every "<" as "\u003c" keeps the
 * JSON identical when parsed and makes breakout impossible. U+2028/U+2029
 * are escaped too since they are valid JSON but illegal in JS source.
 */
export function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `<script type="application/ld+json">${json}<\/script>`;
}
