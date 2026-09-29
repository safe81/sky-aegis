import test from 'node:test';import assert from 'node:assert/strict';
import {classifyPointerPurpose} from '../dist/src/game/input/PointerController.js';
test('settings controls never capture the movement pointer while combat actions remain actions',()=>{
 assert.equal(classifyPointerPurpose(undefined,undefined,true),'ui');
 assert.equal(classifyPointerPurpose('ability',undefined,true),'ability');
 assert.equal(classifyPointerPurpose('pause',undefined,true),'pause');
 assert.equal(classifyPointerPurpose(undefined,undefined,false),'move');
});
