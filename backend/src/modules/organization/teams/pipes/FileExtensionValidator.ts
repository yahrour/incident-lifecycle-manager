import { FileValidator } from "@nestjs/common";

export class FileExtensionValidator extends FileValidator<{
  extensions: string[];
}> {
  isValid(file?: Express.Multer.File): boolean {
    const ext = file?.originalname.split(".").pop()?.toLowerCase();
    return !!ext && this.validationOptions.extensions.includes(ext);
  }

  buildErrorMessage(): string {
    return `Only ${this.validationOptions.extensions.join(", ")} files are supported`;
  }
}
