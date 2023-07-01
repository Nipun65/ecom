const deleteProduct = (btn) => {
  console.log('clicked');
  console.log(btn);

  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  const prodId = btn.parentNode.querySelector('[name=productId]').value;
  const productElemet = btn.closest('article');
  fetch('/admin/product/' + prodId, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf,
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      productElemet.parentNode.removeChild(productElemet);
    })
    .catch((err) => console.log(err));
};
