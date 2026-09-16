<template>
  <div class="forbidden">
    <h1>403</h1>
    <p>У вас нет прав для просмотра этой страницы</p>
    <router-link to="/" class="btn-back">На главную</router-link>
  </div>
</template>

<style scoped>
.forbidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: #6c757d;
}
h1 {
  font-size: 72px;
  color: #dc3545;
  margin-bottom: 16px;
  font-weight: 700;
}
p {
  font-size: 18px;
  margin-bottom: 24px;
}
.btn-back {
  padding: 10px 24px;
  background: #0077c8;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
}
.btn-back:hover {
  background: #00447c;
}
</style>