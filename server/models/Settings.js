const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Settings = sequelize.define(
  "Settings",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "settings",
  }
);

// Static method to get a setting by key
Settings.getSetting = async function (key, defaultValue = null) {
  const setting = await Settings.findOne({ where: { key } });
  return setting ? setting.value : defaultValue;
};

// Static method to set a setting
Settings.setSetting = async function (key, value, description = null) {
  const [setting] = await Settings.upsert({
    key,
    value,
    description,
  });
  return setting;
};

// Static method to get all settings as an object
Settings.getAllSettings = async function () {
  const settings = await Settings.findAll();
  const result = {};
  settings.forEach((s) => {
    result[s.key] = s.value;
  });
  return result;
};

module.exports = Settings;
