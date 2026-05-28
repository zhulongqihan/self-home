// mongosh 脚本：清理 user 表 openid:null + 重建 sparse 索引
// 使用：mongosh couple_app /opt/couple-app/scripts/fix_user_indexes.js

print('-- 1. 删除任何文档中的 openid:null 字段 --');
const r = db.users.updateMany({ openid: null }, { $unset: { openid: '' } });
print('matched=' + r.matchedCount + ' modified=' + r.modifiedCount);

print('-- 2. 当前用户列表 --');
db.users.find({}).forEach(u => printjson({ _id: u._id, openid: u.openid, username: u.username, role: u.role, nickname: u.nickname }));

print('-- 3. 重建 openid_1 索引（unique + sparse）--');
try { db.users.dropIndex('openid_1'); print('old openid_1 dropped'); } catch (e) { print('no old openid_1'); }
printjson(db.users.createIndex({ openid: 1 }, { unique: true, sparse: true, name: 'openid_1' }));

print('-- 4. 重建 username_1 索引 --');
try { db.users.dropIndex('username_1'); print('old username_1 dropped'); } catch (e) { print('no old username_1'); }
printjson(db.users.createIndex({ username: 1 }, { unique: true, sparse: true, name: 'username_1' }));

print('-- 5. 最终索引 --');
db.users.getIndexes().forEach(i => printjson(i));