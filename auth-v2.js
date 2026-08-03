(() => {
  const auth = document.getElementById('auth');
  const phoneStep = document.getElementById('phoneStep');
  const codeStep = document.getElementById('codeStep');
  const bindStep = document.getElementById('bindStep');
  const error = document.getElementById('authError');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSub');
  const API_BASE = localStorage.getItem('luobiApiBase') || '';
  let role = '';

  try {
    const savedAccount = JSON.parse(localStorage.getItem('luobiAccount') || 'null');
    if (!savedAccount || savedAccount.authVersion !== 2) auth.hidden = false;
  } catch {
    auth.hidden = false;
    localStorage.removeItem('luobiAccount');
  }

  title.textContent = '手机号＋密码';
  subtitle.innerHTML = API_BASE
    ? '登录后，两台手机会进入同一个情侣空间'
    : '当前为离线界面体验<br>连接云后台后即可跨手机同步';
  codeStep.hidden = true;
  phoneStep.innerHTML = `
    <label for="phoneV2">中国大陆手机号</label>
    <input id="phoneV2" inputmode="tel" autocomplete="tel" maxlength="11" placeholder="请输入 11 位手机号">
    <label for="passwordV2">密码</label>
    <input id="passwordV2" type="password" autocomplete="current-password" minlength="8" maxlength="64" placeholder="至少 8 位密码">
    <button id="loginV2" type="button">登录</button>
    <button id="registerV2" class="secondary" type="button">第一次使用，注册账号</button>
    <p class="hint">密码不会以明文保存</p>`;

  async function request(path, body) {
    if (!API_BASE) return { offline: true };
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || '请求失败，请稍后重试');
    return data;
  }

  function credentials() {
    const phone = document.getElementById('phoneV2').value.trim();
    const password = document.getElementById('passwordV2').value;
    if (!/^1\d{10}$/.test(phone)) throw new Error('请输入正确的 11 位手机号');
    if (password.length < 8) throw new Error('密码至少需要 8 位');
    return { phone, password };
  }

  async function authenticate(mode) {
    try {
      error.textContent = '';
      const body = credentials();
      const result = await request(`/auth/${mode}`, body);
      localStorage.setItem('luobiPhone', body.phone);
      if (result.token) localStorage.setItem('luobiToken', result.token);
      phoneStep.hidden = true;
      bindStep.hidden = false;
      title.textContent = '绑定我们';
      subtitle.textContent = result.offline ? '离线体验：绑定只保存在当前手机' : '创建或加入属于你们两个人的空间';
    } catch (cause) {
      error.textContent = cause.message;
    }
  }

  document.getElementById('loginV2').onclick = () => authenticate('login');
  document.getElementById('registerV2').onclick = () => authenticate('register');
  document.querySelectorAll('[data-role]').forEach((button) => {
    button.onclick = () => {
      role = button.dataset.role;
      document.querySelectorAll('[data-role]').forEach((item) => item.classList.toggle('active', item === button));
      error.textContent = '';
    };
  });
  document.getElementById('finishBind').onclick = async () => {
    try {
      if (!role) throw new Error('请先选择你是谁');
      const pairCode = document.getElementById('pairCode').value.trim().toUpperCase();
      if (!/^LBXX-[A-Z0-9]{4}$/.test(pairCode)) throw new Error('请输入正确的情侣绑定码');
      const result = await request('/pairs/join', { pairCode, role });
      localStorage.setItem('luobiAccount', JSON.stringify({ authVersion: 2, phone: localStorage.getItem('luobiPhone'), role, pairCode, offline: !!result.offline }));
      auth.hidden = true;
    } catch (cause) {
      error.textContent = cause.message;
    }
  };
})();
