#!/usr/bin/env node
import bcrypt from 'bcrypt';
import '../src/loadEnv.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const email = process.argv[2] || 'admin@dmlkkc.com';
  const password = process.argv[3] || 'Angelo2424$';
  if (!password || password.length < 8) throw new Error('Password missing or too short');
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (!user.isAdmin) {
      user = await prisma.user.update({ where: { email }, data: { isAdmin: true } });
      console.log(`Elevated existing user ${email} to admin.`);
    } else {
      console.log('Admin user already exists.');
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      }
    });
    console.log(`Created admin user ${email}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
