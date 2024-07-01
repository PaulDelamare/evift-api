/**
 * A function that formats the file name based on the input image and base path.
 *
 * @param img - The image file to extract information from.
 * @param basePath - The base path to construct the file path.
 * @return The formatted image path.
 */
export const formatFileName = async (img: File, basePath: string) => {
     // Get current timestamp
     const timestamp = new Date().getTime();
     // Extract file extension
     const ext = img.name.split('.').pop();
     const filename = img.name
          .toLowerCase()
          // Remove file extension
          .replace(/\.[^/.]+$/, '')
          // Remove special characters and replace with hyphens
          .replace(/[^a-z0-9]+/g, '-')
          // Remove leading and trailing hyphens
          .replace(/^-+|-+$/g, '');

     // Add timestamp and extension
     const imgPath = `${basePath}${timestamp}-${filename}.${ext}`;

     // Return formatted image path
     return imgPath;
}