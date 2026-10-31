/**
 * Resolves local and remote asset URLs so they always work seamlessly
 * in local development, production builds, and GitHub Pages project subpaths (e.g. /threads-labstore/).
 */
export function resolveAssetUrl(url: string | undefined): string {
  if (!url) return '';
  
  // External or data URLs are already absolute and valid
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Clean away any development-only prefixes like /src/assets/images/ or /images/
  let clean = url.trim();
  clean = clean.replace(/^\/?src\/assets\/images\//, 'images/');
  clean = clean.replace(/^\/?public\//, '');
  clean = clean.replace(/^\//, ''); // Remove leading slash so it is relative to current directory

  return clean;
}
