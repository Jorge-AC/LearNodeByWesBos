const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const uuid = require('uuid');
const jimp = require('jimp');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    const isPhoto = file.mimetype.startsWith('image/');

    if (isPhoto) {
      cb(null, true);
    } else {
      cb({ message: "That file type isn't allowed" }, false);
    }
  }
};

exports.homepage = (req, res) => {
  res.render('index', { title: 'Home Page' });
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store Page' });
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash('success', 'Store successfully created');
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = parseFloat(req.params.page) || 1;
  const limit = 4;
  const skip = page * limit - limit;

  const countPromise = Store.count();

  const storesPromise = Store.find()
    .limit(limit)
    .skip(skip)
    .sort({ created: 'desc' });

  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash('info', `Hey the page you requested does not exist. So I put you on page ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  res.render('stores', { title: 'Stores', stores, count, pages, page });
};

const checkStoreAuthor = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it');
  }
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  checkStoreAuthor(store, req.user);
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';

  const store = await Store.findOneAndUpdate(
    {
      _id: req.params.id
    },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).exec();

  req.flash(
    'success',
    `Store ${store.name} successfully updated. <a href="/store/${store.slug}">View Store</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;

  const photo = await jimp.read(req.file.buffer);
  await photo.resize(500, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);

  next();
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');

  if (!store) return next();

  res.render('store', { store });
};

exports.getStoreTags = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tag', { tags, tag, title: 'Tags', stores });
};

exports.searchStores = async (req, res) => {
  if (!req.query.q) return;

  const stores = await Store.find(
    {
      $text: {
        $search: req.query.q
      }
    },
    {
      score: { $meta: 'textScore' }
    }
  )
    .sort({
      score: { $meta: 'textScore' }
    })
    .limit(5);

  res.json(stores);
};

exports.mapPage = async (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.getStoresMap = async (req, res) => {
  const { lat, lng } = req.query;

  const stores = await Store.find({
    location: {
      $near: {
        $geometry: {
          type: 'point',
          coordinates: [lng, lat]
        },
        $maxDistance: 10000
      }
    }
  });

  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'point',
          coordinates
        },
        $maxDistance: 10000
      }
    }
  };

  const stores = await Store.find(q)
    .select('slug name description location photo')
    .limit(10);

  res.send(stores);
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(heart => heart.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      [operator]: { hearts: req.params.id }
    },
    {
      new: true
    }
  );
  res.json(user);
};

exports.heartedStores = async (req, res) => {
  const heartedStores = await Store.find({
    _id: { $in: req.user.hearts }
  });

  res.render('stores', { title: 'Hearted Stores', stores: heartedStores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { stores, title: `Top ${stores.length} Stores` });
};
