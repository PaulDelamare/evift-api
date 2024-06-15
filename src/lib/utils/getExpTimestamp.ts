/**
 * Calculates the expiration timestamp in seconds based on the current time and the given number of seconds.
 *
 * @param seconds - The number of seconds until the expiration.
 * @return The expiration timestamp in seconds.
 */
function getExpTimestamp(seconds: number) {
  // Get current time in milliseconds
  const currentTimeMillis = Date.now();
  // Convert seconds into milliseconds
  const secondsIntoMillis = seconds * 1000;
  // Calculate expiration time in milliseconds
  const expirationTimeMillis = currentTimeMillis + secondsIntoMillis;

  // Return expiration time in seconds
  return Math.floor(expirationTimeMillis / 1000);
}

// Export
export { getExpTimestamp };