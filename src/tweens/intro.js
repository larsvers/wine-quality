import { gsap } from 'gsap';

function tweenIntroIn() {
  // Hack as moving the #brand's xPercent doesn't work in Safari.
  const w = window.innerWidth;
  const left = w < 750 ? '90%' : '95%';

  gsap
    .timeline({ defaults: { duration: 1, ease: 'sine.inOut' } })
    .fromTo(
      '#brand p',
      { opacity: 1, fontSize: '0.8em' },
      { opacity: 0, fontSize: '0em', duration: 0.3 }
    )
    .to('#brand', { left }, 0) // move right
    .to('#logo path', { fill: '#ccc' }, 0);
}

function tweenIntroOut() {
  gsap
    .timeline({ defaults: { duration: 1, ease: 'sine.inOut' } })
    .to('#brand p', {
      opacity: 1,
      fontSize: '0.8em',
      delay: 0.7,
      duration: 0.3,
    })
    .to('#brand', { left: '50%' }, 0)
    .to('#logo path', { fill: 'rgba(41, 14, 56, 0.5)' }, 0);
}

export { tweenIntroIn, tweenIntroOut };
