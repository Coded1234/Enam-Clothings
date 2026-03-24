const cron = require("node-cron");
const { Op } = require("sequelize");
const { Cart, CartItem, User, Product } = require("../models");
const { sendEmail } = require("../config/email");

const initCronJobs = () => {
  // Run every hour checks for carts last updated exactly between 24 and 25 hours ago
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running abandoned cart recovery cron job...");
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

      const abandonedCarts = await Cart.findAll({
        where: {
          updatedAt: {
            [Op.lt]: twentyFourHoursAgo,
            [Op.gt]: twentyFiveHoursAgo,
          },
          totalAmount: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "email", "firstName", "lastName"],
          },
          {
            model: CartItem,
            as: "items",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "name", "price", "images"],
              },
            ],
          },
        ],
      });

      if (!abandonedCarts.length) {
        return;
      }

      for (const cart of abandonedCarts) {
        if (!cart.user || !cart.user.email) continue;

        let itemHtml = "";
        cart.items.forEach((item) => {
          if (item.product) {
            itemHtml += `<li>${item.quantity}x ${item.product.name} - $${item.product.price}</li>`;
          }
        });

        const htmlContent = `
          <h2>Hi ${cart.user.firstName || "there"},</h2>
          <p>We noticed you left some items in your cart. They are waiting for you!</p>
          <ul>${itemHtml}</ul>
          <p><a href="${process.env.FRONTEND_URL}/cart" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Your Purchase</a></p>
        `;

        await sendEmail({
          to: cart.user.email,
          subject: "Did you forget something? 🛒",
          html: htmlContent,
        });

        console.log(`Abandoned cart email sent to ${cart.user.email}`);
      }
    } catch (error) {
      console.error("Error running abandoned cart recovery:", error);
    }
  });

  console.log("Cron jobs initialized.");
};

module.exports = { initCronJobs };
