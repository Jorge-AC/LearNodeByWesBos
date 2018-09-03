const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homepage = (req, res) => {
	res.render('index', {title: 'Home Page'})
};

exports.addStore = (req, res) => {
	res.render('editStore', {title: 'Add Store Page'})
};

exports.createStore = async (req, res) => {
  const store = await(new Store(req.body)).save();
  req.flash('success', 'Store successfully created');
  res.redirect(`/stores/${store.slug}`);
};

exports.getStores = async(req, res) => {
  const stores = await Store.find();
  res.render('stores', {title: 'Stores', stores})
};

exports.editStore = async(req, res) => {
  const store = await Store.findOne({_id: req.params.id})
  res.render('editStore', {title: `Edit ${store.name}`, store});
};

exports.updateStore = async(req, res) => {
  const store = await Store.findOneAndUpdate(
    {
      _id: req.params.id
    }, 
    req.body, 
    {
      new: true,
      runValidators: true
    }).exec();

  req.flash('success', `Store ${store.name} successfully updated. <a href="/stores/${store.slug}">View Store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};