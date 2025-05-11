// server/utils/emailSender.js
const nodemailer = require('nodemailer');

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send a reservation confirmation email
 * @param {Object} reservation - Reservation details
 * @param {Object} user - User details
 * @param {Object} restaurant - Restaurant details
 * @returns {Promise} - Nodemailer send response
 */
exports.sendReservationConfirmation = async (reservation, user, restaurant) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reservation Confirmation',
    html: `
      <h1>Reservation Confirmation</h1>
      <p>Dear ${user.first_name} ${user.last_name},</p>
      <p>Your reservation at <strong>${restaurant.name}</strong> has been confirmed.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> ${new Date(reservation.reservation_date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${reservation.reservation_time}</li>
        <li><strong>Party Size:</strong> ${reservation.party_size}</li>
        <li><strong>Reservation ID:</strong> ${reservation.id}</li>
      </ul>
      <p><strong>Restaurant Address:</strong></p>
      <p>
        ${restaurant.address_line1}<br>
        ${restaurant.address_line2 ? restaurant.address_line2 + '<br>' : ''}
        ${restaurant.city}, ${restaurant.state} ${restaurant.zip_code}
      </p>
      <p>If you need to cancel or modify your reservation, please visit our website or contact the restaurant directly.</p>
      <p>Thank you for using our reservation service!</p>
    `
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send a reservation cancellation email
 * @param {Object} reservation - Reservation details
 * @param {Object} user - User details
 * @param {Object} restaurant - Restaurant details
 * @returns {Promise} - Nodemailer send response
 */
exports.sendCancellationNotification = async (reservation, user, restaurant) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reservation Cancellation',
    html: `
      <h1>Reservation Cancelled</h1>
      <p>Dear ${user.first_name} ${user.last_name},</p>
      <p>Your reservation at <strong>${restaurant.name}</strong> has been cancelled.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> ${new Date(reservation.reservation_date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${reservation.reservation_time}</li>
        <li><strong>Party Size:</strong> ${reservation.party_size}</li>
      </ul>
      <p>If you did not request this cancellation, please contact us immediately.</p>
      <p>Thank you for using our reservation service!</p>
    `
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send a restaurant approval notification email
 * @param {Object} restaurant - Restaurant details
 * @param {Object} manager - Restaurant manager details
 * @returns {Promise} - Nodemailer send response
 */
exports.sendRestaurantApprovalNotification = async (restaurant, manager) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: manager.email,
    subject: 'Restaurant Approval Notification',
    html: `
      <h1>Restaurant Approved</h1>
      <p>Dear ${manager.first_name} ${manager.last_name},</p>
      <p>We're pleased to inform you that your restaurant <strong>${restaurant.name}</strong> has been approved on our platform.</p>
      <p>You can now manage your restaurant's profile, tables, and reservations through your dashboard.</p>
      <p>Thank you for partnering with us!</p>
    `
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = exports;