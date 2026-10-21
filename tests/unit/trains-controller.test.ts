import { createTrainController } from '../../src/lib/trains-controller';

// Starea trenurilor de pe Acasă (§5.6): butonul alege, IntersectionObserver doar oprește și repornește în limita alegerii.

test('după oprirea manuală, vizibilitatea nu repornește trenurile', () => {
  const c = createTrainController({ play: vi.fn(), pause: vi.fn() });
  c.userToggle(); c.visibility(false); c.visibility(true);
  expect(c.state()).toBe('oprit');
});

test('oprite automat la ieșirea din ecran, repornite la întoarcere', () => {
  const play = vi.fn(); const c = createTrainController({ play, pause: vi.fn() });
  c.visibility(false); c.visibility(true);
  expect(c.state()).toBe('pornit'); expect(play).toHaveBeenCalled();
});

test('pornește în mișcare, fără să ceară nimic: scriptul a pornit deja animațiile', () => {
  const play = vi.fn();
  const pause = vi.fn();
  const c = createTrainController({ play, pause });
  expect(c.state()).toBe('pornit');
  expect(play).not.toHaveBeenCalled();
  expect(pause).not.toHaveBeenCalled();
});

test('butonul alternează: întoarce alegerea nouă, care dă eticheta', () => {
  const play = vi.fn();
  const pause = vi.fn();
  const c = createTrainController({ play, pause });
  expect(c.userToggle()).toBe('oprit');
  expect(pause).toHaveBeenCalledTimes(1);
  expect(c.userToggle()).toBe('pornit');
  expect(play).toHaveBeenCalledTimes(1);
  expect(c.state()).toBe('pornit');
});

test('ieșirea din ecran după oprirea manuală nu mai oprește o dată ce e oprit', () => {
  const pause = vi.fn();
  const c = createTrainController({ play: vi.fn(), pause });
  c.userToggle();
  c.visibility(false);
  expect(pause).toHaveBeenCalledTimes(1);
});

test('repornite de buton cât harta e în afara ecranului: pleacă abia când harta revine', () => {
  const play = vi.fn();
  const c = createTrainController({ play, pause: vi.fn() });
  c.userToggle();
  c.visibility(false);
  expect(c.userToggle()).toBe('pornit');
  expect(c.state()).toBe('oprit');
  expect(play).not.toHaveBeenCalled();
  c.visibility(true);
  expect(c.state()).toBe('pornit');
  expect(play).toHaveBeenCalledTimes(1);
});

test('aceeași vizibilitate de două ori nu cere de două ori', () => {
  const play = vi.fn();
  const pause = vi.fn();
  const c = createTrainController({ play, pause });
  c.visibility(true);
  c.visibility(false);
  c.visibility(false);
  c.visibility(true);
  c.visibility(true);
  expect(pause).toHaveBeenCalledTimes(1);
  expect(play).toHaveBeenCalledTimes(1);
});
