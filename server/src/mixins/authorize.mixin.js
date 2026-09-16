const ROLE_LABELS = {
  admin: 'Администратор',
  methodist: 'Методист',
  lab_assistant: 'Лаборант',
  technician: 'Техник'
};

module.exports = {
  methods: {
    // Проверка, что пользователь авторизован
    checkIsAuthenticated(ctx) {
      if (!ctx.meta.user) {
        throw new Error('Требуется авторизация');
      }
    },

    // Проверка роли по полю `roles` в экшене
    checkUserRole(ctx) {
      const allowed = ctx.action.roles;   // ← массив ролей

      // Если roles не указан — экшен доступен всем авторизованным
      if (!allowed || allowed.length === 0) return;

      const userRole = ctx.meta.user?.role;
      if (!userRole || !allowed.includes(userRole)) {
        const allowedLabels = allowed.map(r => ROLE_LABELS[r] || r).join(', ');
        throw new Error(`Недостаточно прав. Требуется одна из ролей: ${allowedLabels}`);
      }
    }
  }
};