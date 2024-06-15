function errorServer(error: unknown, message: string) {
    // If error is an instance of Error
    if (error instanceof Error) {
        // Throw Error
        return {status: 500, error: error.message };
    } else {
        // Else Throw custom Error
        return { status: 500, error: message };
    }
  }
  
  export { errorServer };