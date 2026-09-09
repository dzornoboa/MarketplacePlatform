import test from 'node:test'
import assert from 'node:assert/strict'
import { validateEmail,validatePassword,validateSignupInput } from '../lib/auth/validation.ts'
test('signup validation',()=>{assert.equal(validateEmail('person@example.com'),null);assert.match(validateEmail('bad')??'',/valid email/i);assert.equal(validatePassword('GoodPass9!'),null);assert.equal(validateSignupInput({fullName:'Amina Mensah',email:'amina@example.com',password:'SecurePass9!',participantType:'investor'}).ok,true);assert.equal(validateSignupInput({fullName:'Amina Mensah',email:'amina@example.com',password:'SecurePass9!',participantType:'staff'}).ok,false)})
