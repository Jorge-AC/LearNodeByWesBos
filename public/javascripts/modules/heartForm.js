import axios from 'axios';
import { $ } from './bling';

const ajaxHeart = function(e) {
  e.preventDefault();

  axios
    .post(this.action)
    .then(res => {
      const isHearted = this.heart.classList.toggle('heart__button--hearted');
      $('.heart-count').textContent = res.data.hearts.length;
      if (isHearted) {
        this.heart.classList.add('heart__button--float');

        setTimeout(() => {
          this.heart.classList.remove('heart__button--float');
        }, 2500);
      }
    })
    .catch(e => {
      console.log(e);
    });
};

export default ajaxHeart;
