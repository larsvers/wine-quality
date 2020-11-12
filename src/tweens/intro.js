import { gsap } from 'gsap';

function tweenIntroIn() {
  gsap
    .timeline({ defaults: { duration: 1, ease: 'sine.inOut' } })
    .fromTo(
      '#brand p',
      { opacity: 1, fontSize: '0.8em' },
      { opacity: 0, fontSize: '0em', duration: 0.3 }
    )
    .to('#brand', { left: '100%', xPercent: -150 }, 0) // move right
    // .to('#brand', { left: '0%', xPercent: 50 }, 0) // move left
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
    .to('#brand', { left: '50%', xPercent: -50 }, 0)
    .to('#logo path', { fill: 'rgba(41, 14, 56, 0.5)' }, 0);
}

export { tweenIntroIn, tweenIntroOut };
