/**
 * English coaching cues for stored exercises (plan i18n Phase 4).
 * Clés = noms canoniques FR (identiques à EXERCISE_TIPS). Les valeurs sont
 * des repères courts et spécifiques, affichés dans les sélecteurs EN.
 */
const cue = (text: string): string => text;

export const EXERCISE_TIPS_EN: Readonly<Record<string, string>> = {
  'Développé couché barre': cue(
    'Keep shoulder blades tight and feet flat. Lower the bar to the sternum with elbows around 75°, bracing your core to protect the lower back.'
  ),
  'Développé couché haltères': cue(
    'Greater range of motion than the barbell. Control the descent, don’t bounce at the top, and keep shoulders slightly retracted to protect the deltoid.'
  ),
  'Développé incliné barre': cue(
    'Bench 30–45°: any steeper shifts work to the deltoids. Keep elbows under the bar and use a slightly diagonal path.'
  ),
  'Développé incliné haltères': cue(
    'Targets the clavicular head of the pec. Keep the dumbbells aligned with the sternum, not the shoulders.'
  ),
  'Développé décliné barre': cue(
    'Lower-pec variation. Anchor your feet for stability and use less load than on the flat bench.'
  ),
  'Écarté poulie haute': cue(
    'Horizontal opening movement. Keep elbows slightly bent and fixed, move slowly, and feel peak tension at the bottom.'
  ),
  'Écarté poulie basse': cue(
    'Mid/upper-pec variation. Keep the torso upright and the chest proud; avoid excessive arching.'
  ),
  'Pullover haltère': cue(
    'Compound pec + lat movement. Wide arc, elbows slightly bent, feel the stretch at the top.'
  ),
  'Pec deck': cue(
    'Pec isolator. Pads against the elbows, brief squeeze at the finish, and avoid overloading.'
  ),
  'Dips pectoraux': cue(
    'Lean forward 30–45° to target the pecs rather than triceps. Descend to about 90° of shoulder flexion, no deeper.'
  ),
  'Soulevé de terre barre': cue(
    'Neutral back, bar over the mid-foot, drive with the hamstrings then extend the hips. Lock out with hips and knees; don’t pull with the lower back.'
  ),
  'Rowing barre': cue(
    'Hinge about 45°, flat back, pull toward the lower sternum. Drive elbows back rather than lifting the hands; pause one second in contraction.'
  ),
  'Rowing haltère unilatéral': cue(
    'One knee on the bench, back parallel to the floor. Pull the elbow toward the opposite hip without rotating the torso.'
  ),
  'Rowing poulie basse': cue(
    'Pull to the navel with elbows close to the body. Pause 1–2 seconds in contraction; a neutral grip emphasizes the lats.'
  ),
  'Tractions pronation': cue(
    'Overhand grip, shoulders down before pulling. Chest to the bar, full extension at the bottom, no kipping.'
  ),
  'Tractions supination': cue(
    'Underhand grip shifts more work to the biceps. Keep elbows close and avoid swinging.'
  ),
  'Tractions neutral grip': cue(
    'Neutral grip is shoulder-friendly. Keep the torso vertical and pull the elbows down toward the ribs.'
  ),
  'Tirage vertical poulie': cue(
    'Chest proud, pull the bar to the upper chest while driving elbows down. Control the return; don’t lean back excessively.'
  ),
  'Tirage horizontal poulie': cue(
    'Pull the handle to the lower chest with a brief squeeze. Keep shoulders down and avoid leaning back.'
  ),
  'Tirage nuque': cue(
    'Behind-the-neck pulldown: use a wide grip and limited range. Not recommended if the shoulders pinch — prefer a front pulldown.'
  ),
  'Rack pull': cue(
    'Partial deadlift from pins just below the knees. Keep the bar close and the back neutral; lock out hard at the top.'
  ),
  'Rowing T-bar': cue(
    'Chest supported or free-standing, keep the back flat and pull the handles to the lower ribs. Pause in contraction.'
  ),
  'Développé militaire barre': cue(
    'Press overhead without arching the lower back. Glutes and core tight, bar path just past the forehead.'
  ),
  'Développé haltères assis': cue(
    'Seated dumbbell press: keep ribs down and press in a slight arc. Avoid flaring the elbows fully.'
  ),
  'Développé Arnold': cue(
    'Rotate palms from facing you to facing forward as you press. Control the rotation; don’t lock out aggressively.'
  ),
  'Élévations latérales haltères': cue(
    'Lead with the elbows, thumbs slightly down, raise to shoulder height only. Light load, no swinging.'
  ),
  'Élévations latérales poulie': cue(
    'Cable keeps constant tension. Keep a soft bend in the elbow and stop at shoulder height.'
  ),
  'Élévations frontales haltères': cue(
    'Raise to shoulder height in front of you, alternating arms if useful. Don’t swing — the front delts already get heavy work in presses.'
  ),
  'Élévations frontales barre': cue(
    'Use a light bar and a strict range to eye level. Keep the torso still and avoid momentum.'
  ),
  'Face pulls poulie': cue(
    'Pull the rope toward the face with elbows high, targeting rear delts and external rotators. Squeeze briefly at the finish.'
  ),
  'Shrugs barre': cue(
    'Raise the shoulders straight up, pause at the top, then lower fully. No rolling — that stresses the neck.'
  ),
  'Shrugs haltères': cue(
    'Same as barbell shrugs with a neutral grip. Pause at the top and control the descent.'
  ),
  'Oiseau haltères': cue(
    'Hinge at the hips with a flat back, arms slightly bent, open the arms wide. Feel the rear delts, not the traps.'
  ),
  'Rowing menton barre': cue(
    'Upright row with elbows leading wide. Keep the bar close and stop at chest height to protect the shoulders.'
  ),
  'Curl barre droite': cue(
    'Elbows fixed at the sides, curl without swinging, and lower slowly. Supinate gradually to emphasize the biceps.'
  ),
  'Curl barre EZ': cue(
    'EZ bar is easier on the wrists. Keep elbows close and avoid using the lower back to start each rep.'
  ),
  'Curl haltères': cue(
    'Alternate or simultaneous curls with elbows pinned. Rotate the palm outward at the top for a stronger contraction.'
  ),
  'Curl marteau haltères': cue(
    'Neutral grip targets the brachialis and forearm. Keep the upper arm completely still.'
  ),
  'Curl concentré': cue(
    'Seated, elbow braced against the inner thigh. Curl and squeeze at the top, then lower slowly.'
  ),
  'Curl incliné haltères': cue(
    'Incline bench puts the biceps in a stretched position. Let the arms hang behind the torso and curl forward.'
  ),
  'Curl poulie basse': cue(
    'Cable provides constant tension. Keep elbows at your sides and avoid leaning back to cheat.'
  ),
  'Curl poulie haute': cue(
    'Overhead cable curl emphasizes the stretched position. Keep the upper arms still and control the return.'
  ),
  'Curl pupitre': cue(
    'Arm supported on the pad, strict curl with no momentum. Pause at the top before lowering.'
  ),
  'Extension poulie haute': cue(
    'Keep the upper arms fixed close to the head and extend only the forearms. Avoid flaring the elbows.'
  ),
  'Extension haltère nuque': cue(
    'Overhead extension with elbows close. Lower behind the head under control and extend fully.'
  ),
  'Barre au front': cue(
    'EZ bar, elbows pointing forward, lower to the forehead. Keep the upper arms still and use a moderate load.'
  ),
  'Dips triceps': cue(
    'Torso vertical, elbows close to the body. Descend just enough to feel the triceps and press back up.'
  ),
  'Kickbacks haltères': cue(
    'Hinge forward, upper arm parallel to the floor, extend the forearm back. Squeeze at lockout.'
  ),
  'Extension corde poulie': cue(
    'Pull the rope apart at the bottom to maximize triceps contraction. Keep elbows pinned to your sides.'
  ),
  'Skull crushers': cue(
    'Lower the bar toward the forehead with elbows fixed. Control the eccentric and extend fully.'
  ),
  'Squat barre': cue(
    'Brace your core, drive your knees out, and sit between your heels. Keep the torso as upright as your mobility allows and reach full depth.'
  ),
  'Squat goblet': cue(
    'Hold the dumbbell at the chest, elbows down, and sit deep. Use it as a counterbalance to keep the torso upright.'
  ),
  'Front squat': cue(
    'Front rack position, elbows high, torso upright. Keep the heels down and drive through the full foot.'
  ),
  'Presse à cuisses': cue(
    'Feet flat and hip-width, lower until the knees approach the chest without the pelvis lifting. Don’t lock the knees hard.'
  ),
  'Fentes marche haltères': cue(
    'Long stride, torso upright, front shin vertical. Push through the front heel and bring the back foot through under control.'
  ),
  'Fentes barre': cue(
    'Bar resting securely on the traps. Take a controlled step, keep the torso tall, and drive through the front leg.'
  ),
  'Leg extension': cue(
    'Isolate the quads: extend the knee fully, pause briefly, and lower slowly. Avoid swinging the weight.'
  ),
  'Squat hack': cue(
    'Shoulders pinned to the pads, feet flat, descend until knees are deeply bent. Keep the lower back neutral.'
  ),
  'Bulgarian split squat': cue(
    'Rear foot elevated, torso slightly forward, lower until the front thigh is near horizontal. Drive through the front heel.'
  ),
  'Pistol squat': cue(
    'Single-leg squat with the free leg extended. Keep the heel down and use a counterweight if needed for balance.'
  ),
  'Leg curl couché': cue(
    'Hips down, curl the heels toward the glutes, and squeeze. Lower slowly — don’t let the weight drop.'
  ),
  'Leg curl assis': cue(
    'Seated hamstring curl: keep the hips pressed down and curl through the full range. Pause at the bottom of the contraction.'
  ),
  'Soulevé de terre jambes tendues': cue(
    'Soft knees, hips pushed back, bar close to the legs. Feel the hamstring stretch and extend the hips to lock out.'
  ),
  'Soulevé de terre roumain': cue(
    'Neutral back, slight knee bend, hinge until the hamstrings stretch. Drive the hips forward; don’t squat the weight.'
  ),
  'Good morning barre': cue(
    'Bar on the traps, soft knees, hinge at the hips with a flat back. Control the descent and stand tall.'
  ),
  'Hip thrust barre': cue(
    'Upper back on the bench, chin tucked, drive the hips up until the torso is horizontal. Squeeze the glutes at the top.'
  ),
  'Nordic curl': cue(
    'Partner or anchor holds your feet. Lower as slowly as possible with hips extended, then use your hands to reset.'
  ),
  'Hip thrust barre (fessiers)': cue(
    'Glute-focused thrust: tuck the chin, keep the ribs down, and pause one second at full hip extension.'
  ),
  'Cable pull-through': cue(
    'Hinge at the hips and pull the rope through between the legs. Drive with the glutes, not the lower back.'
  ),
  'Squat sumo haltère': cue(
    'Wide stance, toes slightly out, hold the dumbbell between the feet. Keep the torso upright and drive the knees out.'
  ),
  'Fentes marche (fessiers)': cue(
    'Glute-biased split squat: lean slightly forward and take a wider step. Push through the front heel.'
  ),
  'Step-up haltères': cue(
    'Step onto a knee-height box, drive through the top leg, and lower slowly. Don’t push off the floor with the lower leg.'
  ),
  'Pont fessier': cue(
    'Lie on your back, feet hip-width and close to the glutes. Raise the hips and squeeze without arching the lower back.'
  ),
  'Mollets debout machine': cue(
    'Full range: lower the heels below the step, then rise onto the balls of the feet and pause. Don’t bounce.'
  ),
  'Mollets assis machine': cue(
    'Seated calf raise emphasizes the soleus. Control the descent and pause at the top.'
  ),
  'Mollets marche': cue(
    'Hold dumbbells and rise onto the balls of the feet while walking. Keep the knee of the stance leg straight.'
  ),
  'Mollets cheval': cue(
    'Seated, weight on the knees, lower and raise the heels through a full range. Pause briefly at the top.'
  ),
  'Crunch poulie': cue(
    'Kneel facing the cable, hold the rope at the head, and curl the torso down. Leading with the chest, not the neck.'
  ),
  'Russian twists': cue(
    'Sit with a slight lean, twist side to side with the weight close to the body. Keep the movement controlled and the chest tall.'
  ),
  'Relevé de jambes': cue(
    'Hang or lie with the lower back pressed down. Raise the legs with control, then lower slowly without swinging.'
  ),
  'Roue abdominale': cue(
    'Roll out as far as you can while keeping the hips extended and the core braced. Return by pulling with the abs, not the lower back.'
  ),
  'Pallof press': cue(
    'Anti-rotation hold: press the cable straight out and resist the twist. Keep shoulders square and the core tight.'
  ),
  'Dead bug': cue(
    'Lie on your back, arms and knees at 90°. Extend the opposite arm and leg slowly without letting the lower back lift.'
  ),
  'Mountain climbers': cue(
    'Plank position, shoulders over the wrists, drive the knees toward the chest alternately. Keep the hips low and move with control.'
  ),
  'Curl revers haltères': cue(
    'Neutral-grip curls with a slightly exaggerated wrist extension to target the forearm extensors. Keep the elbows still.'
  ),
  'Curl revers barre': cue(
    'Pronated grip, straight bar. Curl strictly without swinging and lower under control.'
  ),
  'Curl poignet barre': cue(
    'Wrists only: rest the forearms on a bench or thighs and flex the wrists upward through a full range.'
  ),
  Hyperextension: cue(
    'Hinge from the hips with a flat back, torso parallel to the floor. Extend to neutral without overextending the lower back.'
  ),
  Crunch: cue(
    'Curl the shoulders off the floor using the abs, not the neck. Control the descent and keep the lower back down.'
  ),
  Planche: cue(
    'Forearms on the floor, elbows under the shoulders, body in a straight line. Brace the core and keep the hips level.'
  ),
};
