export default {
  collectionName: 'singleflowers',
  info: {
    singularName: 'singleflower',
    pluralName: 'singleflowers',
    displayName: 'Singleflower',
    description: 'Окрема квітка для каталогу',
  },
  options: {
    draftAndPublish: true,
  },
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    price: {
      type: 'biginteger',
      required: true,
    },
    description: {
      type: 'blocks',
    },
    color: {
      type: 'enumeration',
      enum: ['chervonij', 'rozhevyj', 'bilyj', 'zhovtyj', 'fioletovyj'],
    },
    collection: {
      type: 'enumeration',
      enum: ['Vesna', 'Lito', 'Osin', 'Zima'],
    },
    cardType: {
      type: 'enumeration',
      enum: ['standart', 'large', 'mini'],
    },
    image: {
      type: 'media',
      multiple: true, // або false, якщо лише одне зображення
      allowedTypes: ['images'],
    },
    slug: {
      type: 'uid',
      targetField: 'name',
    },
  },
};
