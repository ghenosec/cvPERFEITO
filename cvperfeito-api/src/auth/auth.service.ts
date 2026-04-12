import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private google: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {
    this.google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email já cadastrado');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        plan: 'FREE',
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
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Esta conta usa login pelo Google. Clique em "Entrar com Google".',
      );
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');
    return this.buildResponse(user);
  }

  async googleLogin(idToken: string) {
    if (!idToken) throw new BadRequestException('Token do Google não fornecido');

    let payload: any;
    try {
      const ticket = await this.google.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token do Google inválido');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Token do Google não contém email');
    }

    let user = await this.prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: payload.sub,
            avatar: payload.picture || user.avatar,
            name: user.name || payload.name,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            googleId: payload.sub,
            avatar: payload.picture || null,
            plan: 'FREE',
            creditsLeft: 1,
          },
        });
      }
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: payload.picture || user.avatar,
        },
      });
    }

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
      avatar: user.avatar,
      plan: user.plan,
      creditsLeft: user.creditsLeft,
      hasPassword: !!user.passwordHash,
      hasGoogle: !!user.googleId,
    };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true, message: 'Conta excluída com sucesso.' };
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
        avatar: user.avatar,
        plan: user.plan,
        creditsLeft: user.creditsLeft,
      },
    };
  }
}