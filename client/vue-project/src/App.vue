<template>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f4f7fc;
}

.btn-primary {
  background: #4361ee;
  border-color: #4361ee;
}

.btn-primary:hover {
  background: #3a56d4;
  border-color: #3a56d4;
}

.badge-success {
  background: #06d6a0;
}

.badge-warning {
  background: #ffd166;
  color: #1a1a2e;
}

.badge-danger {
  background: #ef476f;
}
</style>