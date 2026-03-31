'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Po prvním přihlášení načte onboarding odpovědi z localStorage a uloží do DB
export default function OnboardingSync() {
  useEffect(() => {
    const raw = localStorage.getItem('onboarding_answers');
    if (!raw) return;

    const answers = JSON.parse(raw);
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from('onboarding_answers').upsert({
        user_id: data.user.id,
        role: answers.role,
        industry: answers.industry,
        team_size: answers.team_size,
        crm_goal: answers.use_case,
        main_goal: answers.goal,
      }).then(() => {
        localStorage.removeItem('onboarding_answers');
      });
    });
  }, []);

  return null;
}
