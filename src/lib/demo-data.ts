/**
 * Données fictives pour la page de démonstration /demo.
 *
 * Aucune écriture : ce module construit des séances en mémoire à partir d'un
 * programme fixe. La page /demo est rendue côté serveur et n'utilise ni
 * Alpine ni localStorage — elle sert uniquement à prévisualiser le design
 * avec un historique réaliste.
 */

import type { Session, SessionExercise, SessionSet } from './storage/types';

export interface DemoProfile {
  name: string;
  initials: string;
  email: string;
  since: string;
  weeklyGoal: number;
}

export const DEMO_PROFILE: DemoProfile = {
  name: 'Alex Martin',
  initials: 'AM',
  email: 'alex.martin@example.test',
  since: '2025-09-14',
  weeklyGoal: 4,
};

interface TemplateExercise {
  id: string;
  name: string;
  muscle: string;
  category: string;
  weight: number;
  sets: number;
  reps: number;
  progression: number;
}

interface Template {
  name: string;
  exercises: TemplateExercise[];
  duration: number;
}

const PUSH: Template = {
  name: 'Push · Pectoraux / Épaules / Triceps',
  duration: 3120,
  exercises: [
    {
      id: 'demo-bench',
      name: 'Développé couché barre',
      muscle: 'Pectoraux',
      category: 'Barre',
      weight: 80,
      sets: 4,
      reps: 8,
      progression: 1.5,
    },
    {
      id: 'demo-ohp',
      name: 'Développé militaire haltères',
      muscle: 'Épaules',
      category: 'Haltère',
      weight: 24,
      sets: 3,
      reps: 10,
      progression: 0.5,
    },
    {
      id: 'demo-tri',
      name: 'Extensions triceps',
      muscle: 'Bras',
      category: 'Machine',
      weight: 35,
      sets: 3,
      reps: 12,
      progression: 0.5,
    },
  ],
};

const PULL: Template = {
  name: 'Pull · Dos / Biceps',
  duration: 2940,
  exercises: [
    {
      id: 'demo-row',
      name: 'Tirage horizontal',
      muscle: 'Dos',
      category: 'Machine',
      weight: 70,
      sets: 4,
      reps: 10,
      progression: 1,
    },
    {
      id: 'demo-dumbbell-row',
      name: 'Rowing haltère',
      muscle: 'Dos',
      category: 'Haltère',
      weight: 32,
      sets: 3,
      reps: 10,
      progression: 0.5,
    },
    {
      id: 'demo-curl',
      name: 'Curl biceps',
      muscle: 'Bras',
      category: 'Haltère',
      weight: 18,
      sets: 3,
      reps: 12,
      progression: 0.5,
    },
  ],
};

const LEGS: Template = {
  name: 'Legs · Quadriceps / Fessiers / Mollets',
  duration: 3300,
  exercises: [
    {
      id: 'demo-squat',
      name: 'Squat barre',
      muscle: 'Jambes',
      category: 'Barre',
      weight: 100,
      sets: 4,
      reps: 6,
      progression: 2,
    },
    {
      id: 'demo-rdl',
      name: 'Soulevé de terre roumain',
      muscle: 'Jambes',
      category: 'Haltère',
      weight: 44,
      sets: 3,
      reps: 10,
      progression: 1,
    },
    {
      id: 'demo-calf',
      name: 'Mollets debout',
      muscle: 'Jambes',
      category: 'Machine',
      weight: 60,
      sets: 3,
      reps: 15,
      progression: 1,
    },
  ],
};

const TEMPLATES: Template[] = [PUSH, PULL, LEGS];
const WEEK_DAYS = [1, 3, 5];

function at(day: Date, hour: number): string {
  const date = new Date(day);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function buildSession(
  id: string,
  date: string,
  template: Template,
  weekIndex: number,
  status: Session['status']
): Session {
  const exercises: SessionExercise[] = template.exercises.map((exercise) => {
    const weight = exercise.weight + weekIndex * exercise.progression;
    const sets: SessionSet[] = Array.from({ length: exercise.sets }, (_, index) => ({
      exerciseId: exercise.id,
      setNumber: index + 1,
      type: index === 0 ? 'warmup' : 'work',
      weight: index === 0 ? Math.round(weight * 0.6) : weight,
      reps: exercise.reps,
      rpe: Math.min(9, 6.5 + index * 0.5),
      completed: status === 'completed',
    }));
    return {
      exerciseId: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      sets,
    };
  });

  return {
    id,
    name: template.name,
    date,
    duration: template.duration,
    exercises,
    status,
    rpe: 7.5,
    fatigue: 3,
    mood: weekIndex % 4 === 0 ? 'great' : 'good',
    notes: weekIndex % 3 === 0 ? 'Bonne séance, les charges montent doucement.' : undefined,
  };
}

/** Construit 12 semaines d'historique + une séance planifiée. */
export function buildDemoSessions(now: Date = new Date()): Session[] {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sessions: Session[] = [];
  let counter = 0;

  for (let weeksAgo = 11; weeksAgo >= 0; weeksAgo -= 1) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() - weeksAgo * 7);
    const weekIndex = 11 - weeksAgo;

    WEEK_DAYS.forEach((offset, slot) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + offset);
      const when = new Date(at(day, slot === 2 ? 10 : 18));
      if (when.getTime() > now.getTime()) return;
      counter += 1;
      sessions.push(
        buildSession(`demo-${counter}`, when.toISOString(), TEMPLATES[slot], weekIndex, 'completed')
      );
    });
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  counter += 1;
  sessions.push(buildSession(`demo-${counter}`, at(tomorrow, 18), PUSH, 11, 'planned'));

  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
