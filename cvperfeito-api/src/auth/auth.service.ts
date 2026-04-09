import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email já cadastrado');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        creditsLeft: 1,
      },
    });
    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');
    return this.buildResponse(user);
  }

  async me(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new UnauthorizedException();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    creditsLeft: user.creditsLeft,
  };
}

private async buildResponse(user: any) {
  const payload = { sub: user.id, email: user.email };
  const accessToken = await this.jwt.signAsync(payload);
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      creditsLeft: user.creditsLeft,
    },
  };
}
}
