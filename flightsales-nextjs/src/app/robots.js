// Block all crawlers during pre-launch phase.
// Change to allow when ready to go live.

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  };
}
