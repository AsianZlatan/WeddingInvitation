const intro = document.querySelector('#intro');
const envelope = document.querySelector('#openInvitation');
const music = document.querySelector('#weddingMusic');
const musicButton = document.querySelector('#musicButton');
const calendarButton = document.querySelector('#addToCalendar');
const form = document.querySelector('#guestForm');
const formStatus = document.querySelector('#formStatus');
const guestCountOutput = document.querySelector('#guestCount');
const guestCountInput = document.querySelector('#guestCountInput');
const decreaseGuests = document.querySelector('#decreaseGuests');
const increaseGuests = document.querySelector('#increaseGuests');
const timelineSwan = document.querySelector('#timelineSwan');
const timelineStops = [...document.querySelectorAll('.timeline-stop')];

let guests = 2;
let invitationOpened = false;

async function startMusic() {
  try {
    await music.play();
    musicButton.setAttribute('aria-pressed', 'true');
    musicButton.setAttribute('aria-label', 'Выключить музыку');
  } catch {
    musicButton.setAttribute('aria-pressed', 'false');
  }
}

function stopMusic() {
  music.pause();
  musicButton.setAttribute('aria-pressed', 'false');
  musicButton.setAttribute('aria-label', 'Включить музыку');
}

musicButton.addEventListener('click', () => {
  music.paused ? startMusic() : stopMusic();
});

envelope.addEventListener('click', () => {
  if (invitationOpened) return;
  invitationOpened = true;
  envelope.classList.add('is-open');
  startMusic();

  window.setTimeout(() => {
    intro.classList.add('is-hidden');
    document.body.classList.add('is-open');
    document.querySelector('#home').scrollIntoView({ block: 'start' });
  }, 1500);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

function setTimelineStep(index) {
  timelineStops.forEach((stop, stopIndex) => stop.classList.toggle('is-active', stopIndex === index));
  const positions = ['9%', '50%', '91%'];
  timelineSwan.style.left = positions[index];
}

timelineStops.forEach((stop) => {
  stop.addEventListener('click', () => setTimelineStep(Number(stop.dataset.step)));
});

function updateGuestCount() {
  guestCountOutput.value = String(guests);
  guestCountOutput.textContent = String(guests);
  guestCountInput.value = String(guests);
}

decreaseGuests.addEventListener('click', () => {
  guests = Math.max(1, guests - 1);
  updateGuestCount();
});

increaseGuests.addEventListener('click', () => {
  guests = Math.min(12, guests + 1);
  updateGuestCount();
});

function downloadCalendarEvent() {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//David and Alina Wedding//RU',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Moscow',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:MSK',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:david-alina-wedding-${Date.now()}@invitation`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    'DTSTART;TZID=Europe/Moscow:20261031T170000',
    'DTEND;TZID=Europe/Moscow:20261031T233000',
    'SUMMARY:Свадьба Давида и Алины',
    'LOCATION:Банкетный зал «Арарат»\, Ростовская улица\, 59Б\, Чалтырь',
    'DESCRIPTION:Свадебное торжество Давида и Алины',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Завтра свадьба Давида и Алины',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'svadba-davida-i-aliny.ics';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

calendarButton.addEventListener('click', downloadCalendarEvent);

function showSuccessDialog() {
  const template = document.querySelector('#successDialogTemplate');
  const dialog = template.content.firstElementChild.cloneNode(true);
  document.body.append(dialog);
  const close = () => dialog.remove();
  dialog.querySelector('button').addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const payload = Object.fromEntries(new FormData(form).entries());
  payload.submittedAt = new Date().toISOString();

  // Для реальной отправки вставьте адрес Formspree или Google Apps Script:
  // const FORM_ENDPOINT = 'https://formspree.io/f/ВАШ_ID';
  const FORM_ENDPOINT = '';

  formStatus.textContent = 'Отправляем ответ…';

  try {
    if (FORM_ENDPOINT) {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Не удалось отправить форму');
    } else {
      localStorage.setItem('wedding-rsvp', JSON.stringify(payload));
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    formStatus.textContent = FORM_ENDPOINT
      ? 'Ответ успешно отправлен.'
      : 'Ответ сохранён на устройстве. Подключите FORM_ENDPOINT в script.js для реальной отправки.';
    showSuccessDialog();
  } catch (error) {
    formStatus.textContent = 'Не удалось отправить ответ. Попробуйте ещё раз.';
    console.error(error);
  }
});
