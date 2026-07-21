import { UsePipes } from '@nestjs/common';
import { SanitizePipe } from '../pipes/sanitize.pipe';

/**
 * Decorator para aplicar sanitização de inputs
 *
 * Uso:
 * @Sanitize()
 * @Post()
 * createUser(@Body() createUserDto: CreateUserDto) { ... }
 */
export function Sanitize() {
  return UsePipes(new SanitizePipe());
}
