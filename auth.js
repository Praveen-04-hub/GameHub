let isLogin = true;

function toggleMode() {
  isLogin = !isLogin;

  const btn = document.getElementById("actionBtn");
  const text = document.getElementById("toggleText");
  const confirm = document.getElementById("confirmGroup");

  if (isLogin) {
    btn.innerText = "Login";
    confirm.style.display = "none";
    text.innerHTML = `Don't have an account? <span onclick="toggleMode()">Register</span>`;
  } else {
    btn.innerText = "Register";
    confirm.style.display = "block";
    text.innerHTML = `Already have an account? <span onclick="toggleMode()">Login</span>`;
  }

  // 🎬 GSAP animation
  gsap.from(".auth-container", {
    scale: 0.95,
    opacity: 0,
    duration: 0.3
  });
}

function handleAction() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!username || !password) {
    alert("Enter details");
    return;
  }

  if (!isLogin) {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    localStorage.setItem("user", JSON.stringify({ username, password }));
    alert("Registered successfully!");
    toggleMode();
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));

  if (user && user.username === username && user.password === password) {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
  } else {
    alert("Invalid credentials");
  }
}
gsap.from(".auth-container", {
  y: 50,
  opacity: 0,
  duration: 0.8
});

