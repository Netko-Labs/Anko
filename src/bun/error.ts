export class AppError extends Error {
  constructor(
    public readonly type: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }

  static database(message: string): AppError {
    return new AppError('Database', `Database error: ${message}`)
  }

  static connectionNotFound(id: string): AppError {
    return new AppError('ConnectionNotFound', `Connection not found: ${id}`)
  }

  static encryption(message: string): AppError {
    return new AppError('Encryption', `Encryption error: ${message}`)
  }

  static storage(message: string): AppError {
    return new AppError('Storage', `Storage error: ${message}`)
  }

  static notFound(message: string): AppError {
    return new AppError('NotFound', `Not found: ${message}`)
  }

  static validation(message: string): AppError {
    return new AppError('Validation', `Validation error: ${message}`)
  }
}
