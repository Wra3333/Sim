const { Lesson, Template, WorkTime, Equipment } = require('../models');
const { Op } = require('sequelize');

const VALID_LESSON_STATUSES = ['Запланировано', 'Проведено', 'Отменено'];

const VALID_PARTICIPANT_TYPES = [
  'vo_specialist',
  'vo_residency',
  'aspirantura',
  'pa',
  'psa',
  'dpo_pp',
  'dpo_pk_vo',
  'dpo_pk_spo',
  'do',
  'master_class',
  ''
];

// ============================================
// ОБЩАЯ ПРОВЕРКА ОБОРУДОВАНИЯ
// ============================================
// «Исправен» и «Частично неисправен» — можно.
// «Требует ремонта», «В ремонте», «Списан» и write_off «На списание»/«Списан» — нельзя.
const isEquipmentInvalid = (eq) => {
  return (
    eq.working_status === 'Требует ремонта' ||
    eq.working_status === 'В ремонте' ||
    eq.working_status === 'Списан' ||
    eq.write_off_status === 'На списание' ||
    eq.write_off_status === 'Списан'
  );
};

module.exports = {
  name: 'lessons',

  actions: {
    // ============================================
    // CREATE
    // ============================================
    create: {
      params: {
        title: { type: 'string', required: true, min: 1, max: 255 },

        group: { type: 'string', optional: true, max: 100 },
        teacher: { type: 'string', optional: true, max: 100 },

        students_count: { type: 'number', required: true, integer: true, min: 0, convert: true },
        date: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        start_time: { type: 'string', required: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        end_time: { type: 'string', required: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        template_id: { type: 'number', integer: true, positive: true, optional: true, convert: true },
        status: { type: 'enum', values: VALID_LESSON_STATUSES, default: 'Запланировано' },
        notes: { type: 'string', optional: true, max: 1000 },
        equipment_list: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              equipment_id: { type: 'number', integer: true, positive: true },
              quantity: { type: 'number', integer: true, min: 1 }
            }
          },
          optional: true
        },

        participant_type: {
          type: 'string',
          optional: true,
          default: '',
          enum: VALID_PARTICIPANT_TYPES
        },
        faculty: { type: 'string', optional: true, max: 255 },
        specialty: { type: 'string', optional: true, max: 255 },
        course: { type: 'number', optional: true, integer: true, convert: true }
      },
      handler: async function(ctx) {
        const data = ctx.params;

        if (data.template_id) {
          const template = await Template.findByPk(data.template_id);
          if (!template) throw new Error('Шаблон не найден');
          if (!template.is_active) throw new Error('Шаблон неактивен и не может быть использован');
        }

        const startTime = data.start_time.substring(0, 5);
        const endTime = data.end_time.substring(0, 5);
        if (startTime >= endTime) {
          throw new Error('Время начала не может быть позже времени окончания');
        }

        if (data.equipment_list && data.equipment_list.length > 0) {
          const ids = data.equipment_list.map(item => item.equipment_id);
          const equipment = await Equipment.findAll({ where: { id: ids } });

          const invalid = equipment.filter(isEquipmentInvalid);

          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в занятии: ${names}`);
          }
        }

        data.start_time = startTime;
        data.end_time = endTime;
        data.created_by = ctx.meta.user?.id;
        data.updated_by = ctx.meta.user?.id;

        data.participant_type = data.participant_type || null;
        data.group = data.group || null;
        data.teacher = data.teacher || null;
        data.faculty = data.faculty || null;
        data.specialty = data.specialty || null;
        data.course = data.course || null;

        const lesson = await Lesson.create(data);

        if (data.status === 'Проведено' && data.equipment_list && data.equipment_list.length > 0) {
          for (const eq of data.equipment_list) {
            await WorkTime.create({
              equipment_id: eq.equipment_id,
              lesson_id: lesson.id,
              start_time: `${data.date} ${data.start_time}`,
              end_time: `${data.date} ${data.end_time}`,
              students_count: data.students_count || 0,
              created_by: ctx.meta.user?.id
            });
          }
        }

        return lesson;
      }
    },

    // ============================================
    // LIST
    // ============================================
    list: {
      params: {
        status: { type: 'enum', values: VALID_LESSON_STATUSES, optional: true },
        group: { type: 'string', optional: true, max: 100 },
        teacher: { type: 'string', optional: true, max: 100 },
        participant_type: { type: 'string', optional: true },
        faculty: { type: 'string', optional: true, max: 255 },
        specialty: { type: 'string', optional: true, max: 255 },
        course: { type: 'number', optional: true, integer: true, convert: true }
      },
      handler: async function(ctx) {
        const where = {};
        if (ctx.params.status) where.status = ctx.params.status;
        if (ctx.params.group) where.group = ctx.params.group;
        if (ctx.params.teacher) where.teacher = ctx.params.teacher;
        if (ctx.params.participant_type) where.participant_type = ctx.params.participant_type;
        if (ctx.params.faculty) where.faculty = ctx.params.faculty;
        if (ctx.params.specialty) where.specialty = ctx.params.specialty;
        if (ctx.params.course) where.course = ctx.params.course;

        return await Lesson.findAll({
          where,
          include: [
            { model: Template, as: 'template' },
            { model: WorkTime, as: 'workTimes' }
          ],
          order: [['created_at', 'DESC']]
        });
      }
    },

    // ============================================
    // GET
    // ============================================
    get: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id, {
          include: [
            { model: Template, as: 'template' },
            { model: WorkTime, as: 'workTimes', include: [{ model: Equipment, as: 'equipment' }] }
          ]
        });
        if (!lesson) throw new Error('Занятие не найдено');
        return lesson;
      }
    },

    // ============================================
    // UPDATE
    // ============================================
    update: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true },
        title: { type: 'string', optional: true, min: 1, max: 255 },
        group: { type: 'string', optional: true, max: 100 },
        teacher: { type: 'string', optional: true, max: 100 },
        students_count: { type: 'number', optional: true, integer: true, min: 0, convert: true },
        date: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        start_time: { type: 'string', optional: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        end_time: { type: 'string', optional: true, pattern: /^\d{2}:\d{2}(:\d{2})?$/ },
        template_id: { type: 'number', optional: true, integer: true, positive: true, convert: true },
        status: { type: 'enum', values: VALID_LESSON_STATUSES, optional: true },
        notes: { type: 'string', optional: true, max: 1000 },
        equipment_list: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              equipment_id: { type: 'number', integer: true, positive: true },
              quantity: { type: 'number', integer: true, min: 1 }
            }
          },
          optional: true
        },
        participant_type: { type: 'string', optional: true, enum: VALID_PARTICIPANT_TYPES },
        faculty: { type: 'string', optional: true, max: 255 },
        specialty: { type: 'string', optional: true, max: 255 },
        course: { type: 'number', optional: true, integer: true, convert: true }
      },
      handler: async function(ctx) {
        const { id, ...data } = ctx.params;
        const lesson = await Lesson.findByPk(id, {
          include: [{ model: WorkTime, as: 'workTimes' }]
        });

        if (!lesson) throw new Error('Занятие не найдено');

        const oldStatus = lesson.status;

        if (data.template_id) {
          const template = await Template.findByPk(data.template_id);
          if (!template) throw new Error('Шаблон не найден');
          if (!template.is_active) throw new Error('Шаблон неактивен и не может быть использован');
        }

        const oldData = {
          date: lesson.date,
          start_time: lesson.start_time,
          end_time: lesson.end_time,
          students_count: lesson.students_count,
          equipment_list: lesson.equipment_list ? JSON.parse(JSON.stringify(lesson.equipment_list)) : [],
          template_id: lesson.template_id,
          status: lesson.status,
          participant_type: lesson.participant_type || ''
        };

        if (data.start_time) {
          data.start_time = data.start_time.substring(0, 5);
        }
        if (data.end_time) {
          data.end_time = data.end_time.substring(0, 5);
        }

        const startTime = data.start_time || lesson.start_time;
        const endTime = data.end_time || lesson.end_time;
        if (startTime && endTime && startTime >= endTime) {
          throw new Error('Время начала не может быть позже времени окончания');
        }

        const equipmentList = data.equipment_list;
        if (equipmentList !== undefined && Array.isArray(equipmentList) && equipmentList.length > 0) {
          const ids = equipmentList.map(item => item.equipment_id);
          const equipment = await Equipment.findAll({ where: { id: ids } });

          const invalid = equipment.filter(isEquipmentInvalid);

          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в занятии: ${names}`);
          }
        }

        if (data.participant_type !== undefined) data.participant_type = data.participant_type || null;
        if (data.group !== undefined) data.group = data.group || null;
        if (data.teacher !== undefined) data.teacher = data.teacher || null;
        if (data.faculty !== undefined) data.faculty = data.faculty || null;
        if (data.specialty !== undefined) data.specialty = data.specialty || null;
        if (data.course !== undefined) data.course = data.course || null;

        data.updated_by = ctx.meta.user?.id;
        await lesson.update(data);

        const newStatus = data.status || lesson.status;

        if (newStatus === 'Отменено') {
          await WorkTime.destroy({ where: { lesson_id: lesson.id } });
          return await Lesson.findByPk(id, {
            include: [{ model: WorkTime, as: 'workTimes' }]
          });
        }

        if (newStatus === 'Проведено' && oldStatus !== 'Проведено') {
          const finalEquipmentList = equipmentList !== undefined ? equipmentList : (lesson.equipment_list || []);
          await WorkTime.destroy({ where: { lesson_id: lesson.id } });

          if (finalEquipmentList.length > 0) {
            const finalDate = data.date || lesson.date;
            const finalStart = data.start_time || lesson.start_time;
            const finalEnd = data.end_time || lesson.end_time;
            const finalStudents = data.students_count !== undefined ? data.students_count : lesson.students_count;

            for (const eq of finalEquipmentList) {
              await WorkTime.create({
                equipment_id: eq.equipment_id,
                lesson_id: lesson.id,
                start_time: `${finalDate} ${finalStart}`,
                end_time: `${finalDate} ${finalEnd}`,
                students_count: finalStudents || 0,
                created_by: ctx.meta.user?.id
              });
            }
          }
          return await Lesson.findByPk(id, {
            include: [{ model: WorkTime, as: 'workTimes' }]
          });
        }

        if (newStatus === 'Запланировано' && oldStatus === 'Проведено') {
          await WorkTime.destroy({ where: { lesson_id: lesson.id } });
          return await Lesson.findByPk(id, {
            include: [{ model: WorkTime, as: 'workTimes' }]
          });
        }

        if (newStatus === 'Проведено') {
          const finalEquipmentList = equipmentList !== undefined ? equipmentList : (lesson.equipment_list || []);
          const finalDate = data.date || lesson.date;
          const finalStart = data.start_time || lesson.start_time;
          const finalEnd = data.end_time || lesson.end_time;
          const finalStudents = data.students_count !== undefined ? data.students_count : lesson.students_count;

          const timeChanged =
            (data.date && data.date !== oldData.date) ||
            (data.start_time && data.start_time !== oldData.start_time) ||
            (data.end_time && data.end_time !== oldData.end_time) ||
            (data.students_count !== undefined && data.students_count !== oldData.students_count);

          const equipmentChanged = data.equipment_list !== undefined &&
            JSON.stringify(data.equipment_list) !== JSON.stringify(oldData.equipment_list);

          const templateChanged = data.template_id !== undefined && data.template_id !== oldData.template_id;

          if (timeChanged || equipmentChanged || templateChanged) {
            await WorkTime.destroy({ where: { lesson_id: lesson.id } });

            if (finalEquipmentList.length > 0) {
              for (const eq of finalEquipmentList) {
                await WorkTime.create({
                  equipment_id: eq.equipment_id,
                  lesson_id: lesson.id,
                  start_time: `${finalDate} ${finalStart}`,
                  end_time: `${finalDate} ${finalEnd}`,
                  students_count: finalStudents || 0,
                  created_by: ctx.meta.user?.id
                });
              }
            }
          }
        }

        return await Lesson.findByPk(id, {
          include: [{ model: WorkTime, as: 'workTimes' }]
        });
      }
    },

    // ============================================
    // COMPLETE
    // ============================================
    complete: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id);
        if (!lesson) throw new Error('Занятие не найдено');
        if (lesson.status === 'Проведено') throw new Error('Занятие уже проведено');

        const equipments = lesson.equipment_list
          ? (typeof lesson.equipment_list === 'string' ? JSON.parse(lesson.equipment_list) : lesson.equipment_list)
          : [];

        if (equipments && equipments.length > 0) {
          const ids = equipments.map(eq => eq.equipment_id);
          const equipment = await Equipment.findAll({ where: { id: ids } });

          const invalid = equipment.filter(isEquipmentInvalid);

          if (invalid.length > 0) {
            const names = invalid
              .map(e => `${e.name} (статус: ${e.working_status}, списание: ${e.write_off_status})`)
              .join(', ');
            throw new Error(`Оборудование не может быть использовано в занятии: ${names}`);
          }

          const startTime = lesson.start_time ? lesson.start_time.substring(0, 5) : lesson.start_time;
          const endTime = lesson.end_time ? lesson.end_time.substring(0, 5) : lesson.end_time;

          for (const eq of equipments) {
            await WorkTime.create({
              equipment_id: eq.equipment_id,
              lesson_id: lesson.id,
              start_time: `${lesson.date} ${startTime}`,
              end_time: `${lesson.date} ${endTime}`,
              students_count: lesson.students_count || 0,
              created_by: ctx.meta.user?.id
            });
          }
        }

        await lesson.update({
          status: 'Проведено',
          updated_by: ctx.meta.user?.id
        });
        return lesson;
      }
    },

    // ============================================
    // DELETE
    // ============================================
    delete: {
      params: {
        id: { type: 'number', required: true, integer: true, positive: true, convert: true }
      },
      handler: async function(ctx) {
        const lesson = await Lesson.findByPk(ctx.params.id);
        if (!lesson) throw new Error('Занятие не найдено');
        await lesson.destroy();
        return { success: true };
      }
    },

    // ============================================
    // GET PARTICIPANT STATS
    // ============================================
    getParticipantStats: {
      params: {
        dateFrom: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        dateTo: { type: 'string', optional: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        group: { type: 'string', optional: true },
        faculty: { type: 'string', optional: true },
        specialty: { type: 'string', optional: true },
        course: { type: 'number', optional: true, integer: true, convert: true }
      },
      handler: async function(ctx) {
        const where = { status: 'Проведено' };

        if (ctx.params.dateFrom) where.date = { [Op.gte]: ctx.params.dateFrom };
        if (ctx.params.dateTo) where.date = { ...where.date, [Op.lte]: ctx.params.dateTo };
        if (ctx.params.group) where.group = ctx.params.group;
        if (ctx.params.faculty) where.faculty = ctx.params.faculty;
        if (ctx.params.specialty) where.specialty = ctx.params.specialty;
        if (ctx.params.course) where.course = ctx.params.course;

        const lessons = await Lesson.findAll({
          where,
          attributes: ['participant_type', 'students_count', 'group', 'date', 'faculty', 'specialty', 'course']
        });

        const stats = {
          vo_specialist: { count: 0, total_students: 0 },
          vo_residency: { count: 0, total_students: 0 },
          aspirantura: { count: 0, total_students: 0 },
          pa: { count: 0, total_students: 0 },
          psa: { count: 0, total_students: 0 },
          dpo_pp: { count: 0, total_students: 0 },
          dpo_pk_vo: { count: 0, total_students: 0 },
          dpo_pk_spo: { count: 0, total_students: 0 },
          do: { count: 0, total_students: 0 },
          master_class: { count: 0, total_students: 0 },
          unspecified: { count: 0, total_students: 0 }
        };

        const groupStats = {};
        const dateStats = {};

        let totalLessons = lessons.length;
        let totalStudents = 0;

        for (const lesson of lessons) {
          const type = lesson.participant_type || 'unspecified';
          const students = lesson.students_count || 0;

          if (stats[type]) {
            stats[type].count += 1;
            stats[type].total_students += students;
          }
          totalStudents += students;

          if (lesson.group) {
            if (!groupStats[lesson.group]) groupStats[lesson.group] = { total: 0, by_type: {} };
            groupStats[lesson.group].total += students;
            if (!groupStats[lesson.group].by_type[type]) groupStats[lesson.group].by_type[type] = 0;
            groupStats[lesson.group].by_type[type] += students;
          }

          if (lesson.date) {
            if (!dateStats[lesson.date]) dateStats[lesson.date] = { total: 0, by_type: {} };
            dateStats[lesson.date].total += students;
            if (!dateStats[lesson.date].by_type[type]) dateStats[lesson.date].by_type[type] = 0;
            dateStats[lesson.date].by_type[type] += students;
          }
        }

        const total = totalStudents || 1;
        for (const type in stats) {
          stats[type].percentage = ((stats[type].total_students / total) * 100).toFixed(1);
        }

        return {
          success: true,
          period: { from: ctx.params.dateFrom || null, to: ctx.params.dateTo || null },
          total: { lessons: totalLessons, students: totalStudents },
          stats,
          by_group: groupStats,
          by_date: dateStats
        };
      }
    }
  }
};