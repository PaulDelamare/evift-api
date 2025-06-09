/**
 * Calculates the expiration timestamp in seconds based on the current time and the given number of seconds.
 *
 * @param seconds - The number of seconds until the expiration.
 * @return The expiration timestamp in seconds.
 */
function getExpTimestamp(seconds: number) {
  const currentTimeMillis = Date.now();
  const secondsIntoMillis = seconds * 1000;
  const expirationTimeMillis = currentTimeMillis + secondsIntoMillis;

  // Return expiration time in seconds
  return Math.floor(expirationTimeMillis / 1000);
}

export { getExpTimestamp };