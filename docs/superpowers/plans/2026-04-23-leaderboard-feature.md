# Leaderboard Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为微信小游戏合集接入用户登录、分数记录和排行榜功能，使用 Vercel Serverless API + Supabase 数据库作为后端。

**Architecture:** 客户端（微信小游戏 Canvas）通过 `wx.request()` 调用 Vercel Serverless API，API 层负责微信登录鉴权（`wx.login` → `code2Session`）、数据校验和分数写入，Supabase 作为 PostgreSQL 数据库存储用户和分数数据。客户端永远不直接访问 Supabase，所有写操作由 Vercel 后端使用 service_role key 完成。

**Tech Stack:** 微信小游戏 JavaScript (Canvas)、Vercel Serverless Functions (Node.js)、Supabase (PostgreSQL)、JWT (jsonwebtoken)、axios

---

## File Structure

### 后端（Vercel API 项目 — 新建独立仓库/目录）

```
2048minigame-api/
├── api/
│   ├── login.js                 # POST /api/login — 微信登录
│   ├── user.js                  # POST /api/user — 更新用户信息
│   ├── score.js                 # POST /api/score — 提交分数
│   └── leaderboard.js           # GET /api/leaderboard — 获取排行榜
├── lib/
│   ├── supabase.js              # Supabase 客户端封装
│   ├── wechat.js                # 微信 code2Session API 封装
│   └── auth.js                  # JWT 鉴权中间件
├── vercel.json
├── package.json
└── .gitignore
```

### 前端（小游戏客户端 — 修改现有项目）

```
2048minigame/
├── api/                         # 新增：API 通信模块
│   ├── client.js                # HTTP 请求封装（wx.request）
│   ├── auth.js                  # 登录鉴权模块
│   └── leaderboard.js           # 排行榜 API 封装
├── scenes/                      # 新增：排行榜场景
│   └── leaderboard.js           # 排行榜 Canvas 渲染与交互
├── common/
│   └── constants.js             # 修改：新增 SCENE.LEADERBOARD
├── storage.js                   # 修改：新增 token 存储辅助函数
├── game.js                      # 修改：集成排行榜场景与登录流程
└── games/
    ├── game-2048.js             # 修改：游戏结束时提交分数
    ├── game-popstar.js          # 修改：游戏结束时提交分数
    └── game-watersort.js        # 修改：游戏结束时提交分数
```

---

## Phase 1: Supabase 数据库搭建

### Task 1: 创建 Supabase 项目与数据库表

**Files:**
- External: Supabase Dashboard (SQL Editor)

- [ ] **Step 1: 在 Supabase Dashboard 创建新项目**

1. 前往 https://supabase.com 注册/登录
2. 点击 "New Project"，填写项目名称（如 `minigames-leaderboard`）
3. 设置数据库密码，选择区域 **Northeast Asia (Tokyo)**
4. 等待项目初始化完成

- [ ] **Step 2: 在 SQL Editor 中执行建表 SQL**

```sql
CREATE TABLE users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid      VARCHAR(64) UNIQUE NOT NULL,
  unionid     VARCHAR(64),
  nickname    VARCHAR(64) DEFAULT '玩家',
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_openid ON users(openid);

CREATE TABLE scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type   VARCHAR(32) NOT NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_game_type ON scores(game_type);
CREATE INDEX idx_scores_game_type_score ON scores(game_type, score DESC);
CREATE INDEX idx_scores_user_id ON scores(user_id);
```

`game_type` 合法值为：`'2048-4x4'`、`'2048-5x5'`、`'2048-6x6'`、`'popstar'`、`'watersort'`

- [ ] **Step 3: 启用 RLS 并创建策略**

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Scores are publicly readable" ON scores
  FOR SELECT USING (true);
```

分数写入由 Vercel 后端使用 `service_role` key 完成，绕过 RLS。

- [ ] **Step 4: 创建排行榜查询视图**

```sql
CREATE VIEW leaderboard_view AS
SELECT
  s.game_type,
  s.score,
  u.nickname,
  u.avatar_url,
  ROW_NUMBER() OVER (PARTITION BY s.game_type ORDER BY s.score DESC) AS rank
FROM scores s
JOIN users u ON s.user_id = u.id;
```

- [ ] **Step 5: 记录 Supabase 凭证**

在本地安全位置记录：
- Project URL: `https://<project-ref>.supabase.co`
- Anon Key: `eyJ...`（公开，可用于客户端只读操作）
- Service Role Key: `eyJ...`（私密，仅后端使用）

---

## Phase 2: Vercel Serverless API 开发

### Task 2: 初始化 Vercel API 项目

**Files:**
- Create: `2048minigame-api/package.json`
- Create: `2048minigame-api/.gitignore`
- Create: `2048minigame-api/vercel.json`

- [ ] **Step 1: 创建项目目录并初始化**

```bash
mkdir -p 2048minigame-api/api 2048minigame-api/lib
cd 2048minigame-api
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
npm install @supabase/supabase-js jsonwebtoken axios
```

- [ ] **Step 3: 创建 .gitignore**

```gitignore
node_modules
.env
.vercel
```

- [ ] **Step 4: 创建 vercel.json**

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization" }
      ]
    }
  ]
}
```

- [ ] **Step 5: 创建 .env 文件（本地开发用，不提交到 Git）**

```env
WX_APPID=wxe544546395d46864
WX_SECRET=你的微信AppSecret
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_KEY=你的service_role_key
JWT_SECRET=随机生成的32位字符串
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: init vercel api project"
```

---

### Task 3: 实现 Supabase 客户端封装

**Files:**
- Create: `2048minigame-api/lib/supabase.js`

- [ ] **Step 1: 编写 Supabase 客户端**

```js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, supabaseAdmin };
```

`supabaseAdmin` 使用 service_role key，绕过 RLS，用于写入操作。

---

### Task 4: 实现微信 API 封装

**Files:**
- Create: `2048minigame-api/lib/wechat.js`

- [ ] **Step 1: 编写 code2Session 函数**

```js
const axios = require('axios');

const WX_APPID = process.env.WX_APPID;
const WX_SECRET = process.env.WX_SECRET;

async function code2Session(code) {
  const url = 'https://api.weixin.qq.com/sns/jscode2session';
  const response = await axios.get(url, {
    params: {
      appid: WX_APPID,
      secret: WX_SECRET,
      js_code: code,
      grant_type: 'authorization_code'
    }
  });

  if (response.data.errcode) {
    throw new Error(`WeChat API error: ${response.data.errcode} - ${response.data.errmsg}`);
  }

  return {
    openid: response.data.openid,
    sessionKey: response.data.session_key,
    unionid: response.data.unionid || null
  };
}

module.exports = { code2Session };
```

---

### Task 5: 实现 JWT 鉴权中间件

**Files:**
- Create: `2048minigame-api/lib/auth.js`

- [ ] **Step 1: 编写 token 验证函数**

```js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, openid: decoded.openid };
  } catch (err) {
    return null;
  }
}

function generateToken(userId, openid) {
  return jwt.sign(
    { userId, openid },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { verifyToken, generateToken };
```

---

### Task 6: 实现登录接口

**Files:**
- Create: `2048minigame-api/api/login.js`

- [ ] **Step 1: 编写登录 API**

```js
const { code2Session } = require('../lib/wechat');
const { supabaseAdmin } = require('../lib/supabase');
const { generateToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    const { openid, unionid } = await code2Session(code);

    let { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();

    const isNewUser = !user;

    if (isNewUser) {
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const insertData = {
        openid,
        nickname: '玩家' + randomSuffix
      };
      if (unionid) insertData.unionid = unionid;

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('User insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      user = newUser;
    }

    const token = generateToken(user.id, openid);

    return res.status(200).json({
      token,
      isNewUser,
      userInfo: {
        nickname: user.nickname,
        avatarUrl: user.avatar_url
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed' });
  }
};
```

- [ ] **Step 2: 本地测试登录接口**

```bash
npx vercel dev
```

用 curl 或 Postman 发送 POST 请求到 `http://localhost:3000/api/login`，body 为 `{"code": "test_code"}`。预期：因 code 无效返回微信 API 错误（这是正常的，说明接口链路通了）。

- [ ] **Step 3: Commit**

```bash
git add api/login.js
git commit -m "feat: add login api endpoint"
```

---

### Task 7: 实现用户信息更新接口

**Files:**
- Create: `2048minigame-api/api/user.js`

- [ ] **Step 1: 编写用户信息更新 API**

```js
const { verifyToken } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { nickname, avatarUrl } = req.body || {};

  const updateData = {};
  if (nickname !== undefined) {
    if (typeof nickname !== 'string' || nickname.length === 0 || nickname.length > 64) {
      return res.status(400).json({ error: 'Invalid nickname' });
    }
    updateData.nickname = nickname;
  }
  if (avatarUrl !== undefined) {
    if (typeof avatarUrl !== 'string') {
      return res.status(400).json({ error: 'Invalid avatarUrl' });
    }
    updateData.avatar_url = avatarUrl;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateData.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.userId)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    return res.status(200).json({
      success: true,
      userInfo: {
        nickname: data.nickname,
        avatarUrl: data.avatar_url
      }
    });
  } catch (err) {
    console.error('User update error:', err.message);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add api/user.js
git commit -m "feat: add user info update api endpoint"
```

---

### Task 8: 实现分数提交接口

**Files:**
- Create: `2048minigame-api/api/score.js`

- [ ] **Step 1: 编写分数提交 API**

```js
const { verifyToken } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/supabase');

const VALID_GAME_TYPES = ['2048-4x4', '2048-5x5', '2048-6x6', 'popstar', 'watersort'];

const MAX_SCORES = {
  '2048-4x4': 4000000,
  '2048-5x5': 16000000,
  '2048-6x6': 64000000,
  'popstar': 10000000,
  'watersort': 10000
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { gameType, score } = req.body || {};

  if (!VALID_GAME_TYPES.includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: 'Invalid score' });
  }

  const maxScore = MAX_SCORES[gameType] || 9999999;
  if (score > maxScore) {
    return res.status(400).json({ error: 'Score exceeds maximum possible value' });
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('scores')
      .select('score')
      .eq('user_id', user.userId)
      .eq('game_type', gameType)
      .order('score', { ascending: false })
      .limit(1);

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('scores')
      .insert({
        user_id: user.userId,
        game_type: gameType,
        score
      })
      .select()
      .single();

    if (insertError) {
      console.error('Score insert error:', insertError);
      return res.status(500).json({ error: 'Failed to submit score' });
    }

    const bestScore = existing && existing.length > 0
      ? Math.max(existing[0].score, score)
      : score;

    const { count, error: rankError } = await supabaseAdmin
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('game_type', gameType)
      .gt('score', bestScore);

    const rank = (count || 0) + 1;

    return res.status(200).json({
      success: true,
      bestScore,
      rank
    });
  } catch (err) {
    console.error('Score submit error:', err.message);
    return res.status(500).json({ error: 'Failed to submit score' });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add api/score.js
git commit -m "feat: add score submission api endpoint"
```

---

### Task 9: 实现排行榜查询接口

**Files:**
- Create: `2048minigame-api/api/leaderboard.js`

- [ ] **Step 1: 编写排行榜查询 API**

```js
const { verifyToken } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/supabase');

const VALID_GAME_TYPES = ['2048-4x4', '2048-5x5', '2048-6x6', 'popstar', 'watersort'];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameType, limit } = req.query;

  if (!VALID_GAME_TYPES.includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  const queryLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  try {
    const { data: scores, error } = await supabaseAdmin
      .from('scores')
      .select('score, user_id, users(nickname, avatar_url)')
      .eq('game_type', gameType)
      .order('score', { ascending: false })
      .limit(queryLimit);

    if (error) {
      console.error('Leaderboard query error:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    const list = scores.map((entry, index) => ({
      rank: index + 1,
      nickname: entry.users.nickname,
      avatarUrl: entry.users.avatar_url,
      score: entry.score
    }));

    let myRank = null;
    const user = verifyToken(req);
    if (user) {
      const { data: myBest } = await supabaseAdmin
        .from('scores')
        .select('score')
        .eq('user_id', user.userId)
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(1)
        .single();

      if (myBest) {
        const { count } = await supabaseAdmin
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('game_type', gameType)
          .gt('score', myBest.score);

        myRank = {
          rank: (count || 0) + 1,
          score: myBest.score
        };
      }
    }

    return res.status(200).json({ list, myRank });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add api/leaderboard.js
git commit -m "feat: add leaderboard query api endpoint"
```

---

### Task 10: 部署 Vercel API 并配置环境变量

**Files:**
- External: Vercel Dashboard

- [ ] **Step 1: 安装 Vercel CLI 并登录**

```bash
npm i -g vercel
vercel login
```

- [ ] **Step 2: 部署项目**

```bash
cd 2048minigame-api
vercel --prod
```

记录部署后的 URL，如 `https://2048minigame-api.vercel.app`

- [ ] **Step 3: 在 Vercel Dashboard 配置环境变量**

进入项目 Settings → Environment Variables，添加：

| Key | Value |
|-----|-------|
| `WX_APPID` | `wxe544546395d46864` |
| `WX_SECRET` | 微信公众平台获取的 AppSecret |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `JWT_SECRET` | 随机生成的 32 位字符串 |

- [ ] **Step 4: 重新部署使环境变量生效**

```bash
vercel --prod
```

- [ ] **Step 5: 验证 API 可访问**

```bash
curl https://你的域名.vercel.app/api/leaderboard?gameType=2048-4x4
```

预期返回：`{"list":[],"myRank":null}`

---

## Phase 3: 小游戏客户端集成

### Task 11: 新增场景常量

**Files:**
- Modify: `common/constants.js`

- [ ] **Step 1: 在 SCENE 对象中新增 LEADERBOARD**

将 `common/constants.js` 中的 SCENE 对象修改为：

```js
const SCENE = {
  HOME: 'home',
  HOME_2048_MODE: 'home_2048_mode',
  GAME_2048: 'game_2048',
  GAME_POPSTAR: 'game_popstar',
  POPSTAR_CONFIRM: 'popstar_confirm',
  GAME_WATERSORT: 'game_watersort',
  WATERSORT_CONFIRM: 'watersort_confirm',
  LEADERBOARD: 'leaderboard'
};
```

- [ ] **Step 2: 新增 GAME_TYPE_MAP 常量**

在 `common/constants.js` 底部 `module.exports` 之前新增：

```js
const GAME_TYPE_MAP = {
  '4x4': '2048-4x4',
  '5x5': '2048-5x5',
  '6x6': '2048-6x6',
  'popstar': 'popstar',
  'watersort': 'watersort'
};
```

在 `module.exports` 中新增 `GAME_TYPE_MAP`：

```js
module.exports = {
  SCENE,
  GAME_TYPES,
  GAME_TYPE_MAP
};
```

- [ ] **Step 3: Commit**

```bash
git add common/constants.js
git commit -m "feat: add LEADERBOARD scene and GAME_TYPE_MAP constant"
```

---

### Task 12: 实现 HTTP 请求封装

**Files:**
- Create: `api/client.js`

- [ ] **Step 1: 创建 api 目录并编写 client.js**

```js
const BASE_URL = 'https://你的域名.vercel.app/api';

function request(path, options) {
  options = options || {};
  var token = '';
  try {
    token = wx.getStorageSync('auth_token') || '';
  } catch (e) {
    console.error('Failed to read auth token:', e);
  }

  return new Promise(function (resolve, reject) {
    wx.request({
      url: BASE_URL + path,
      method: options.method || 'GET',
      data: options.data || {},
      header: Object.assign(
        { 'Content-Type': 'application/json' },
        token ? { 'Authorization': 'Bearer ' + token } : {}
      ),
      success: function (res) {
        if (res.statusCode === 401) {
          try { wx.removeStorageSync('auth_token'); } catch (e) {}
          reject(new Error('Unauthorized'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error((res.data && res.data.error) || 'Request failed'));
        }
      },
      fail: function (err) {
        reject(new Error(err.errMsg || 'Network error'));
      }
    });
  });
}

module.exports = { request: request };
```

注意：使用 `var` 和 `function` 而非 `const`/`let`/箭头函数，与项目现有代码风格保持一致。

---

### Task 13: 实现登录鉴权模块

**Files:**
- Create: `api/auth.js`

- [ ] **Step 1: 编写 auth.js**

```js
var { request } = require('./client');

var currentUser = null;

function login() {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (loginRes) {
        request('/login', {
          method: 'POST',
          data: { code: loginRes.code }
        }).then(function (result) {
          try {
            wx.setStorageSync('auth_token', result.token);
          } catch (e) {
            console.error('Failed to save auth token:', e);
          }
          currentUser = result.userInfo;
          resolve(result);
        }).catch(reject);
      },
      fail: function (err) {
        reject(new Error(err.errMsg || 'wx.login failed'));
      }
    });
  });
}

function ensureLogin() {
  var token = '';
  try { token = wx.getStorageSync('auth_token') || ''; } catch (e) {}
  if (token && currentUser) {
    return Promise.resolve(currentUser);
  }
  return login().then(function (result) {
    return result.userInfo;
  });
}

function getCurrentUser() {
  return currentUser;
}

function isLoggedIn() {
  var token = '';
  try { token = wx.getStorageSync('auth_token') || ''; } catch (e) {}
  return !!token;
}

function logout() {
  try { wx.removeStorageSync('auth_token'); } catch (e) {}
  currentUser = null;
}

module.exports = {
  login: login,
  ensureLogin: ensureLogin,
  getCurrentUser: getCurrentUser,
  isLoggedIn: isLoggedIn,
  logout: logout
};
```

---

### Task 14: 实现排行榜 API 封装

**Files:**
- Create: `api/leaderboard.js`

- [ ] **Step 1: 编写 leaderboard.js**

```js
var { request } = require('./client');

function submitScore(gameType, score) {
  return request('/score', {
    method: 'POST',
    data: { gameType: gameType, score: score }
  });
}

function getLeaderboard(gameType, limit) {
  limit = limit || 50;
  return request('/leaderboard?gameType=' + gameType + '&limit=' + limit);
}

module.exports = {
  submitScore: submitScore,
  getLeaderboard: getLeaderboard
};
```

- [ ] **Step 2: Commit api 模块**

```bash
git add api/
git commit -m "feat: add api client, auth, and leaderboard modules"
```

---

### Task 15: 扩展 storage.js 添加 token 辅助函数

**Files:**
- Modify: `storage.js`

- [ ] **Step 1: 在 storage.js 末尾 module.exports 之前新增 token 辅助函数**

```js
function loadAuthToken() {
  try {
    return wx.getStorageSync('auth_token') || '';
  } catch (e) {
    console.error('Failed to load auth token:', e);
    return '';
  }
}

function saveAuthToken(token) {
  try {
    wx.setStorageSync('auth_token', token);
  } catch (e) {
    console.error('Failed to save auth token:', e);
  }
}

function clearAuthToken() {
  try {
    wx.removeStorageSync('auth_token');
  } catch (e) {
    console.error('Failed to clear auth token:', e);
  }
}
```

在 `module.exports` 中新增这三个函数：

```js
module.exports = {
  loadBestScore,
  saveBestScore,
  loadSaveState,
  saveSaveState,
  clearSaveState,
  hasSaveState,
  loadAllModesInfo,
  loadPopstarBestScore,
  savePopstarBestScore,
  loadPopstarSaveState,
  savePopstarSaveState,
  clearPopstarSaveState,
  hasPopstarSaveState,
  loadWatersortBestScore,
  saveWatersortBestScore,
  loadWatersortSaveState,
  saveWatersortSaveState,
  clearWatersortSaveState,
  hasWatersortSaveState,
  loadWatersortBestMoves,
  saveWatersortBestMoves,
  loadAllGameTypesInfo,
  loadAuthToken,
  saveAuthToken,
  clearAuthToken
};
```

- [ ] **Step 2: Commit**

```bash
git add storage.js
git commit -m "feat: add auth token storage helpers"
```

---

### Task 16: 实现排行榜场景 Canvas 渲染

**Files:**
- Create: `scenes/leaderboard.js`

- [ ] **Step 1: 编写排行榜场景模块**

```js
var { SCENE, GAME_TYPE_MAP } = require('../common/constants');
var { getTheme } = require('../common/themes');
var { getLeaderboard } = require('../api/leaderboard');
var { isLoggedIn, getCurrentUser, ensureLogin } = require('../api/auth');

var LEADERBOARD_TABS = [
  { key: '2048-4x4', label: '4×4' },
  { key: '2048-5x5', label: '5×5' },
  { key: '2048-6x6', label: '6×6' },
  { key: 'popstar', label: '星星' },
  { key: 'watersort', label: '水排序' }
];

function LeaderboardScene(baseGame) {
  this.base = baseGame;
  this.ctx = baseGame.ctx;

  this.currentTab = '2048-4x4';
  this.leaderboardData = [];
  this.myRank = null;
  this.isLoading = false;
  this.loadError = null;

  this.tabButtons = [];
  this.backButton = null;
  this.refreshButton = null;
}

LeaderboardScene.prototype.initLeaderboard = function () {
  this.base.currentScene = SCENE.LEADERBOARD;
  this.currentTab = '2048-4x4';
  this.leaderboardData = [];
  this.myRank = null;
  this.loadError = null;
  this.recalculateLayout();
  this.fetchLeaderboard();
};

LeaderboardScene.prototype.recalculateLayout = function () {
  var base = this.base;
  var headerHeight = base.rpx(120);
  var tabHeight = base.rpx(72);
  var tabMarginTop = base.rpx(20);

  this.titleY = base.rpx(80);
  this.tabY = headerHeight + tabMarginTop;
  this.listStartY = this.tabY + tabHeight + base.rpx(24);
  this.listEndY = base.screenHeight - base.rpx(160);
  this.myRankCardY = base.screenHeight - base.rpx(140);

  var tabCount = LEADERBOARD_TABS.length;
  var tabWidth = (base.gameWidth - base.rpx(16) * (tabCount - 1)) / tabCount;
  this.tabButtons = LEADERBOARD_TABS.map(function (tab, index) {
    return {
      key: tab.key,
      label: tab.label,
      x: base.gameX + index * (tabWidth + base.rpx(16)),
      y: this.tabY,
      width: tabWidth,
      height: tabHeight
    };
  }.bind(this));

  this.backButton = {
    x: base.gameX,
    y: this.titleY - base.rpx(30),
    width: base.rpx(64),
    height: base.rpx(64)
  };

  this.refreshButton = {
    x: base.gameX + base.gameWidth - base.rpx(64),
    y: this.titleY - base.rpx(30),
    width: base.rpx(64),
    height: base.rpx(64)
  };
};

LeaderboardScene.prototype.fetchLeaderboard = function () {
  this.isLoading = true;
  this.loadError = null;

  getLeaderboard(this.currentTab, 50).then(function (data) {
    this.leaderboardData = data.list || [];
    this.myRank = data.myRank || null;
    this.isLoading = false;
  }.bind(this)).catch(function (err) {
    console.error('Failed to fetch leaderboard:', err);
    this.loadError = err.message || '加载失败';
    this.isLoading = false;
  }.bind(this));
};

LeaderboardScene.prototype.switchTab = function (tabKey) {
  if (tabKey === this.currentTab) return;
  this.currentTab = tabKey;
  this.leaderboardData = [];
  this.myRank = null;
  this.fetchLeaderboard();
};

LeaderboardScene.prototype.renderLeaderboard = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  base.drawBackground();
  this.drawTitle();
  this.drawTabs();
  this.drawList();
  this.drawMyRank();
};

LeaderboardScene.prototype.drawTitle = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  var gradient = ctx.createLinearGradient(
    base.gameX + base.gameWidth / 2 - base.rpx(100), this.titleY - base.rpx(30),
    base.gameX + base.gameWidth / 2 + base.rpx(100), this.titleY
  );
  gradient.addColorStop(0, theme.titleGradient[0]);
  gradient.addColorStop(1, theme.titleGradient[1]);

  ctx.fillStyle = gradient;
  ctx.font = 'bold ' + Math.round(base.rpx(44)) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('排行榜', base.gameX + base.gameWidth / 2, this.titleY);

  ctx.fillStyle = theme.themeBtnBg;
  base.drawRoundedRect(
    this.backButton.x, this.backButton.y,
    this.backButton.width, this.backButton.height,
    Math.round(this.backButton.width / 2)
  );
  ctx.fill();
  ctx.fillStyle = theme.titleText;
  ctx.font = 'bold ' + Math.round(base.rpx(28)) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('←', this.backButton.x + this.backButton.width / 2, this.backButton.y + this.backButton.height / 2);

  ctx.fillStyle = theme.themeBtnBg;
  base.drawRoundedRect(
    this.refreshButton.x, this.refreshButton.y,
    this.refreshButton.width, this.refreshButton.height,
    Math.round(this.refreshButton.width / 2)
  );
  ctx.fill();
  ctx.fillStyle = theme.titleText;
  ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('↻', this.refreshButton.x + this.refreshButton.width / 2, this.refreshButton.y + this.refreshButton.height / 2);
};

LeaderboardScene.prototype.drawTabs = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  for (var i = 0; i < this.tabButtons.length; i++) {
    var tab = this.tabButtons[i];
    var isActive = tab.key === this.currentTab;

    if (isActive) {
      var tabGradient = ctx.createLinearGradient(tab.x, tab.y, tab.x + tab.width, tab.y);
      tabGradient.addColorStop(0, theme.cardAccent[0]);
      tabGradient.addColorStop(1, theme.cardAccent[1]);
      ctx.fillStyle = tabGradient;
    } else {
      ctx.fillStyle = theme.themeBtnBg;
    }

    base.drawRoundedRect(tab.x, tab.y, tab.width, tab.height, base.rpx(36));
    ctx.fill();

    ctx.fillStyle = isActive
      ? (base.isDark ? '#0D1B2A' : '#FFFFFF')
      : theme.subtitleText;
    ctx.font = 'bold ' + Math.round(base.rpx(22)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tab.label, tab.x + tab.width / 2, tab.y + tab.height / 2);
  }
};

LeaderboardScene.prototype.drawList = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  if (this.isLoading) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('加载中...', base.gameX + base.gameWidth / 2, (this.listStartY + this.listEndY) / 2);
    return;
  }

  if (this.loadError) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.loadError, base.gameX + base.gameWidth / 2, (this.listStartY + this.listEndY) / 2);
    return;
  }

  if (this.leaderboardData.length === 0) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无数据', base.gameX + base.gameWidth / 2, (this.listStartY + this.listEndY) / 2);
    return;
  }

  var rowHeight = base.rpx(72);
  var maxVisible = Math.floor((this.listEndY - this.listStartY) / rowHeight);
  var visibleCount = Math.min(this.leaderboardData.length, maxVisible);

  for (var i = 0; i < visibleCount; i++) {
    var entry = this.leaderboardData[i];
    var rowY = this.listStartY + i * rowHeight;

    if (i % 2 === 0) {
      ctx.fillStyle = base.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
      base.drawRoundedRect(base.gameX, rowY, base.gameWidth, rowHeight, base.rpx(8));
      ctx.fill();
    }

    var rankText = '';
    if (entry.rank === 1) rankText = '🥇';
    else if (entry.rank === 2) rankText = '🥈';
    else if (entry.rank === 3) rankText = '🥉';
    else rankText = entry.rank.toString();

    ctx.fillStyle = entry.rank <= 3 ? theme.scoreValue : theme.titleText;
    ctx.font = 'bold ' + Math.round(base.rpx(26)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankText, base.gameX + base.rpx(48), rowY + rowHeight / 2);

    ctx.fillStyle = theme.titleText;
    ctx.font = Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(entry.nickname, base.gameX + base.rpx(96), rowY + rowHeight / 2);

    ctx.fillStyle = theme.scoreValue;
    ctx.font = 'bold ' + Math.round(base.rpx(24)) + 'px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(entry.score.toString(), base.gameX + base.gameWidth - base.rpx(24), rowY + rowHeight / 2);
  }
};

LeaderboardScene.prototype.drawMyRank = function () {
  var theme = getTheme(this.base.isDark);
  var ctx = this.ctx;
  var base = this.base;

  var cardX = base.gameX;
  var cardY = this.myRankCardY;
  var cardWidth = base.gameWidth;
  var cardHeight = base.rpx(120);

  ctx.shadowColor = base.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = base.isDark ? base.rpx(10) : base.rpx(6);
  ctx.shadowOffsetY = base.isDark ? base.rpx(3) : base.rpx(2);

  var cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY);
  cardGradient.addColorStop(0, theme.cardGradient[0]);
  cardGradient.addColorStop(1, theme.cardGradient[1]);
  ctx.fillStyle = cardGradient;
  base.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, base.rpx(20));
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (!isLoggedIn()) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(22)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('登录后查看你的排名', cardX + cardWidth / 2, cardY + cardHeight / 2);
    return;
  }

  if (!this.myRank) {
    ctx.fillStyle = theme.subtitleText;
    ctx.font = Math.round(base.rpx(22)) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无排名', cardX + cardWidth / 2, cardY + cardHeight / 2);
    return;
  }

  var user = getCurrentUser() || {};
  ctx.fillStyle = theme.scoreLabel;
  ctx.font = Math.round(base.rpx(16)) + 'px system-ui';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MY RANK', cardX + base.rpx(24), cardY + base.rpx(36));

  ctx.fillStyle = theme.titleText;
  ctx.font = 'bold ' + Math.round(base.rpx(32)) + 'px system-ui';
  ctx.fillText('#' + this.myRank.rank, cardX + base.rpx(24), cardY + base.rpx(72));

  ctx.fillStyle = theme.scoreValue;
  ctx.font = 'bold ' + Math.round(base.rpx(28)) + 'px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText(this.myRank.score.toString(), cardX + cardWidth - base.rpx(24), cardY + cardHeight / 2);
};

LeaderboardScene.prototype.checkButtonClick = function (x, y) {
  var base = this.base;

  if (x >= this.backButton.x && x <= this.backButton.x + this.backButton.width &&
      y >= this.backButton.y && y <= this.backButton.y + this.backButton.height) {
    base.initHome();
    return true;
  }

  if (x >= this.refreshButton.x && x <= this.refreshButton.x + this.refreshButton.width &&
      y >= this.refreshButton.y && y <= this.refreshButton.y + this.refreshButton.height) {
    this.fetchLeaderboard();
    return true;
  }

  for (var i = 0; i < this.tabButtons.length; i++) {
    var tab = this.tabButtons[i];
    if (x >= tab.x && x <= tab.x + tab.width &&
        y >= tab.y && y <= tab.y + tab.height) {
      this.switchTab(tab.key);
      return true;
    }
  }

  return false;
};

module.exports = { LeaderboardScene: LeaderboardScene };
```

- [ ] **Step 2: Commit**

```bash
git add scenes/leaderboard.js
git commit -m "feat: add leaderboard canvas scene"
```

---

### Task 17: 集成排行榜场景到主游戏

**Files:**
- Modify: `game.js`

- [ ] **Step 1: 在 game.js 顶部引入排行榜模块**

在 `game.js` 的 require 区域新增：

```js
var { LeaderboardScene } = require('./scenes/leaderboard');
```

- [ ] **Step 2: 在 MiniGames constructor 中初始化排行榜场景**

在 `constructor()` 中 `this.gameWatersort = new GameWatersort(this);` 之后新增：

```js
this.leaderboardScene = new LeaderboardScene(this);
```

- [ ] **Step 3: 新增 enterLeaderboard 方法**

在 `goBackHome()` 方法之后新增：

```js
enterLeaderboard() {
  this.leaderboardScene.initLeaderboard();
}
```

- [ ] **Step 4: 在 render 方法中新增 LEADERBOARD 场景渲染**

在 `render()` 方法的 else-if 链末尾新增：

```js
else if (this.currentScene === SCENE.LEADERBOARD) {
  this.leaderboardScene.renderLeaderboard();
}
```

- [ ] **Step 5: 在 checkButtonClick 方法中新增 LEADERBOARD 场景处理**

在 `checkButtonClick(x, y)` 方法的 else-if 链末尾新增：

```js
else if (this.currentScene === SCENE.LEADERBOARD) {
  buttonClicked = this.leaderboardScene.checkButtonClick(x, y);
}
```

- [ ] **Step 6: Commit**

```bash
git add game.js
git commit -m "feat: integrate leaderboard scene into main game"
```

---

### Task 18: 在主页添加排行榜入口

**Files:**
- Modify: `common/index.js`

- [ ] **Step 1: 在 BaseGame constructor 中新增排行榜按钮尺寸**

在 `calculateDimensions()` 方法中新增排行榜按钮尺寸定义（在 `this.soundBtnSize` 之后）：

```js
this.leaderboardBtnSize = this.rpx(88);
```

- [ ] **Step 2: 在主页渲染中绘制排行榜按钮**

在 `renderHome()` 方法中，`this.drawGameTypeCards();` 之后新增：

```js
this.drawLeaderboardButton();
```

- [ ] **Step 3: 新增 drawLeaderboardButton 方法**

在 `BaseGame` 类中新增方法：

```js
drawLeaderboardButton() {
  var theme = this.theme;
  var ctx = this.ctx;

  var btnX = this.gameX + this.gameWidth - this.leaderboardBtnSize;
  var btnY = this.homeTitleY - this.rpx(40);

  ctx.shadowColor = this.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.06)';
  ctx.shadowBlur = this.isDark ? this.rpx(10) : this.rpx(6);
  ctx.shadowOffsetY = this.isDark ? this.rpx(3) : this.rpx(2);

  ctx.fillStyle = theme.themeBtnBg;
  this.drawRoundedRect(btnX, btnY, this.leaderboardBtnSize, this.leaderboardBtnSize, Math.round(this.leaderboardBtnSize / 2));
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = theme.titleText;
  ctx.font = Math.round(this.rpx(30)) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏆', btnX + this.leaderboardBtnSize / 2, btnY + this.leaderboardBtnSize / 2);

  this.leaderboardBtn = { x: btnX, y: btnY, width: this.leaderboardBtnSize, height: this.leaderboardBtnSize };
}
```

- [ ] **Step 4: 在主页 checkButtonClick 中处理排行榜按钮点击**

在 `BaseGame.checkButtonClick` 方法的 `SCENE.HOME` 分支中，gameTypeCards 循环之后新增：

```js
if (!buttonClicked && this.leaderboardBtn) {
  if (x >= this.leaderboardBtn.x && x <= this.leaderboardBtn.x + this.leaderboardBtn.width &&
      y >= this.leaderboardBtn.y && y <= this.leaderboardBtn.y + this.leaderboardBtn.height) {
    this.enterLeaderboard();
    buttonClicked = true;
  }
}
```

- [ ] **Step 5: 在 MiniGames 类中新增 enterLeaderboard 方法**

在 `game.js` 的 `MiniGames` 类中新增（如果 Task 17 中还没有添加的话）：

```js
enterLeaderboard() {
  this.leaderboardScene.initLeaderboard();
}
```

- [ ] **Step 6: Commit**

```bash
git add common/index.js game.js
git commit -m "feat: add leaderboard entry button on home page"
```

---

### Task 19: 游戏结束时提交分数 — 2048

**Files:**
- Modify: `games/game-2048.js`

- [ ] **Step 1: 在 game-2048.js 顶部引入 API 模块**

在文件顶部 require 区域新增：

```js
var { ensureLogin } = require('../api/auth');
var { submitScore } = require('../api/leaderboard');
var { GAME_TYPE_MAP } = require('../common/constants');
```

- [ ] **Step 2: 新增 submitScoreToServer 方法**

在 `Game2048` 类中新增方法：

```js
submitScoreToServer() {
  if (!this.currentMode) return;
  var gameType = GAME_TYPE_MAP[this.currentMode.id];
  if (!gameType) return;

  ensureLogin().then(function () {
    return submitScore(gameType, this.score);
  }.bind(this)).then(function (result) {
    if (result.success) {
      console.log('Score submitted. Best: ' + result.bestScore + ', Rank: ' + result.rank);
    }
  }).catch(function (err) {
    console.error('Failed to submit score:', err);
  });
}
```

- [ ] **Step 3: 在游戏结束时调用提交分数**

在 `moveInDirection` 方法中，`this.isGameOver = true;` 之后新增：

```js
this.submitScoreToServer();
```

- [ ] **Step 4: Commit**

```bash
git add games/game-2048.js
git commit -m "feat: submit 2048 score to server on game over"
```

---

### Task 20: 游戏结束时提交分数 — 消灭星星

**Files:**
- Modify: `games/game-popstar.js`

- [ ] **Step 1: 在 game-popstar.js 顶部引入 API 模块**

```js
var { ensureLogin } = require('../api/auth');
var { submitScore } = require('../api/leaderboard');
```

- [ ] **Step 2: 新增 submitScoreToServer 方法**

在 `GamePopstar` 类中新增：

```js
submitScoreToServer() {
  ensureLogin().then(function () {
    return submitScore('popstar', this.popstarTotalScore);
  }.bind(this)).then(function (result) {
    if (result.success) {
      console.log('Popstar score submitted. Best: ' + result.bestScore + ', Rank: ' + result.rank);
    }
  }).catch(function (err) {
    console.error('Failed to submit popstar score:', err);
  });
}
```

- [ ] **Step 3: 在游戏结束时调用提交分数**

找到消灭星星游戏结束（`this.popstarIsGameOver = true`）的位置，在其后新增：

```js
this.submitScoreToServer();
```

- [ ] **Step 4: Commit**

```bash
git add games/game-popstar.js
git commit -m "feat: submit popstar score to server on game over"
```

---

### Task 21: 游戏结束时提交分数 — 水排序

**Files:**
- Modify: `games/game-watersort.js`

- [ ] **Step 1: 在 game-watersort.js 顶部引入 API 模块**

```js
var { ensureLogin } = require('../api/auth');
var { submitScore } = require('../api/leaderboard');
```

- [ ] **Step 2: 新增 submitScoreToServer 方法**

在 `GameWatersort` 类中新增：

```js
submitScoreToServer() {
  ensureLogin().then(function () {
    return submitScore('watersort', this.watersortLevel);
  }.bind(this)).then(function (result) {
    if (result.success) {
      console.log('Watersort score submitted. Best: ' + result.bestScore + ', Rank: ' + result.rank);
    }
  }).catch(function (err) {
    console.error('Failed to submit watersort score:', err);
  });
}
```

注意：水排序的 "分数" 是关卡数（`watersortLevel`），而非传统分数。

- [ ] **Step 3: 在关卡完成时调用提交分数**

找到水排序关卡完成（`this.watersortIsComplete = true`）的位置，在其后新增：

```js
this.submitScoreToServer();
```

- [ ] **Step 4: Commit**

```bash
git add games/game-watersort.js
git commit -m "feat: submit watersort score to server on level complete"
```

---

## Phase 4: 微信小游戏配置

### Task 22: 配置服务器域名白名单

**Files:**
- External: 微信公众平台

- [ ] **Step 1: 登录微信公众平台**

前往 https://mp.weixin.qq.com 登录小游戏管理后台。

- [ ] **Step 2: 添加 request 合法域名**

进入 开发管理 → 开发设置 → 服务器域名 → request 合法域名，添加：

```
https://你的域名.vercel.app
```

- [ ] **Step 3: 验证域名配置**

在微信开发者工具中，打开调试器 Console，执行：

```js
wx.request({
  url: 'https://你的域名.vercel.app/api/leaderboard?gameType=2048-4x4',
  success: function(res) { console.log(res.data); },
  fail: function(err) { console.error(err); }
});
```

预期返回：`{list: [], myRank: null}`

---

### Task 23: 更新 API client 中的 BASE_URL

**Files:**
- Modify: `api/client.js`

- [ ] **Step 1: 将 BASE_URL 替换为实际部署地址**

将 `api/client.js` 中的：

```js
var BASE_URL = 'https://你的域名.vercel.app/api';
```

替换为 Vercel 部署后的实际地址：

```js
var BASE_URL = 'https://实际域名.vercel.app/api';
```

- [ ] **Step 2: Commit**

```bash
git add api/client.js
git commit -m "chore: update api base url to production"
```

---

## Phase 5: 端到端测试

### Task 24: 完整流程测试

- [ ] **Step 1: 测试登录流程**

1. 在微信开发者工具中打开小游戏
2. 点击主页排行榜按钮 🏆
3. 验证自动静默登录（控制台无报错）
4. 验证排行榜页面正常加载

- [ ] **Step 2: 测试分数提交**

1. 进入 2048 游戏，玩到 Game Over
2. 检查控制台输出 "Score submitted" 日志
3. 进入排行榜，验证分数已显示

- [ ] **Step 3: 测试排行榜切换**

1. 在排行榜页面切换不同 Tab（4×4 / 5×5 / 6×6 / 星星 / 水排序）
2. 验证每个 Tab 数据正确加载
3. 验证刷新按钮正常工作

- [ ] **Step 4: 测试返回导航**

1. 从排行榜点击返回按钮 ←
2. 验证返回主页正常

- [ ] **Step 5: 测试离线容错**

1. 断开网络
2. 玩游戏到结束
3. 验证本地分数正常保存，控制台显示网络错误但不崩溃
4. 恢复网络，进入排行榜验证数据加载正常

---

## 安全与防作弊清单

| 措施 | 实现位置 |
|------|---------|
| 服务端 JWT 鉴权 | `lib/auth.js` → 所有写接口 |
| 分数上限校验 | `api/score.js` → `MAX_SCORES` 映射 |
| gameType 白名单 | `api/score.js` → `VALID_GAME_TYPES` |
| openid 不暴露给客户端 | `api/login.js` → 只返回 JWT token |
| Supabase Service Key 仅后端使用 | `lib/supabase.js` → `supabaseAdmin` |
| RLS 策略 | Supabase SQL → 公开只读，写入仅 service_role |
| HTTPS 强制 | Vercel 默认提供 |
| 401 自动清除 token | `api/client.js` → 请求拦截 |

---

## Self-Review 补充项

以下问题在自检中发现并补充：

### 补充 1: Token 过期自动重新登录

**问题**：`api/client.js` 中 401 响应只清除了 token，但没有自动重新登录，导致用户 token 过期后需要手动重新进入排行榜才能恢复。

**修复**：修改 `api/client.js` 的 401 处理逻辑：

```js
success: function (res) {
  if (res.statusCode === 401) {
    try { wx.removeStorageSync('auth_token'); } catch (e) {}
    var { login } = require('./auth');
    login().then(function () {
      request(path, options).then(resolve).catch(reject);
    }).catch(function () {
      reject(new Error('Unauthorized'));
    });
    return;
  }
  // ... 其余逻辑不变
}
```

**注意**：此修改需加入 Task 12 的 `api/client.js` 中。同时需要添加重试次数限制（最多重试 1 次），防止无限循环：

```js
function request(path, options) {
  options = options || {};
  var isRetry = options._isRetry || false;
  // ... 其余不变

  if (res.statusCode === 401) {
    if (isRetry) {
      reject(new Error('Unauthorized'));
      return;
    }
    try { wx.removeStorageSync('auth_token'); } catch (e) {}
    var { login } = require('./auth');
    login().then(function () {
      var retryOptions = Object.assign({}, options, { _isRetry: true });
      delete retryOptions._isRetry;
      request(path, retryOptions).then(resolve).catch(reject);
    }).catch(function () {
      reject(new Error('Unauthorized'));
    });
    return;
  }
}
```

### 补充 2: 排行榜同一用户去重

**问题**：当前每次游戏结束都插入一条新记录，同一用户可能有多个分数记录。排行榜查询时同一用户会出现多次，排名不准确。

**修复**：修改 `api/leaderboard.js` 的查询逻辑，使用 Supabase 的 `rpc` 或子查询去重。更简单的方案是修改 Supabase 视图：

在 Task 1 Step 4 的 `leaderboard_view` 替换为：

```sql
CREATE OR REPLACE VIEW leaderboard_view AS
WITH best_scores AS (
  SELECT DISTINCT ON (user_id, game_type)
    user_id, game_type, score
  FROM scores
  ORDER BY user_id, game_type, score DESC
)
SELECT
  b.game_type,
  b.score,
  u.nickname,
  u.avatar_url,
  ROW_NUMBER() OVER (PARTITION BY b.game_type ORDER BY b.score DESC) AS rank
FROM best_scores b
JOIN users u ON b.user_id = u.id;
```

同时修改 `api/leaderboard.js` 中的查询，改为使用视图或子查询：

```js
const { data: scores, error } = await supabaseAdmin
  .rpc('get_leaderboard', { p_game_type: gameType, p_limit: queryLimit });
```

或者更简单的方案：在 `api/leaderboard.js` 中使用 Supabase 的 `select` 配合 `order` 和手动去重：

```js
const { data: allScores, error } = await supabaseAdmin
  .from('scores')
  .select('score, user_id, users(nickname, avatar_url)')
  .eq('game_type', gameType)
  .order('score', { ascending: false });

if (error) { /* ... */ }

var seen = new Set();
var list = [];
for (var i = 0; i < allScores.length; i++) {
  var entry = allScores[i];
  if (seen.has(entry.user_id)) continue;
  seen.add(entry.user_id);
  list.push({
    rank: list.length + 1,
    nickname: entry.users.nickname,
    avatarUrl: entry.users.avatar_url,
    score: entry.score
  });
  if (list.length >= queryLimit) break;
}
```

### 补充 3: 排行榜"我的排名"卡片点击登录

**问题**：排行榜底部 "登录后查看你的排名" 文字没有交互，用户不知道如何登录。

**修复**：在 `scenes/leaderboard.js` 的 `checkButtonClick` 方法中，新增对 myRankCard 区域的点击检测：

```js
LeaderboardScene.prototype.checkButtonClick = function (x, y) {
  // ... 现有按钮检测

  if (!isLoggedIn()) {
    var cardX = this.base.gameX;
    var cardY = this.myRankCardY;
    var cardWidth = this.base.gameWidth;
    var cardHeight = this.base.rpx(120);
    if (x >= cardX && x <= cardX + cardWidth &&
        y >= cardY && y <= cardY + cardHeight) {
      var { ensureLogin } = require('../api/auth');
      ensureLogin().then(function () {
        this.fetchLeaderboard();
      }.bind(this)).catch(function (err) {
        console.error('Login failed:', err);
      });
      return true;
    }
  }

  return false;
};
```

### 补充 4: ensureLogin 中 token 存在但 currentUser 为 null 的处理

**问题**：`api/auth.js` 的 `ensureLogin()` 中，如果 token 存在但 `currentUser` 为 null（如小程序重启后内存变量被清空），会重新调用 `login()`，浪费一次 `wx.login()` 和网络请求。

**修复**：修改 `ensureLogin` 逻辑，token 存在时先尝试使用现有 token，只在请求返回 401 时才重新登录：

```js
function ensureLogin() {
  var token = '';
  try { token = wx.getStorageSync('auth_token') || ''; } catch (e) {}
  if (token) {
    if (currentUser) {
      return Promise.resolve(currentUser);
    }
    // token 存在但内存中无用户信息，尝试用 token 请求用户信息
    var { request } = require('./client');
    return request('/user', { method: 'POST', data: {} }).then(function (result) {
      currentUser = result.userInfo;
      return currentUser;
    }).catch(function () {
      // token 无效，重新登录
      return login().then(function (result) {
        return result.userInfo;
      });
    });
  }
  return login().then(function (result) {
    return result.userInfo;
  });
}
```

**注意**：这要求 `api/user.js` 在 body 为空时也能返回当前用户信息。修改 `api/user.js`：

```js
// 在 updateData 校验之后，如果 body 为空则返回当前用户信息
if (Object.keys(updateData).length === 0) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('nickname, avatar_url')
    .eq('id', user.userId)
    .single();

  return res.status(200).json({
    success: true,
    userInfo: {
      nickname: data.nickname,
      avatarUrl: data.avatar_url
    }
  });
}
```

### 补充 5: 游戏结束弹窗增加"查看排行榜"按钮

**问题**：当前游戏结束只显示 "Game Over" 遮罩，没有引导用户去排行榜。

**修复**：在 `games/game-2048.js` 的 `drawOverlay` 方法中，在 "Score: xxx" 文字下方新增一行提示文字：

```js
ctx.fillStyle = theme.subtitleText;
ctx.font = Math.round(this.base.rpx(14)) + 'px system-ui';
ctx.fillText('点击重新开始 | 🏆 查看排行榜', centerX, centerY + this.base.rpx(48));
```

同时在 `checkButtonClick` 的 Game Over 点击处理中，检测点击位置是否在"排行榜"文字区域，如果是则跳转排行榜。更简单的方案是：在 Game Over 遮罩上增加一个小的排行榜图标按钮。

此修改需要在 Task 19 中一并完成。
