  export const addDecimals = (num) => {
      return (Math.round(num * 100) / 100).toFixed(2);
    };
    export const updateCart = (state) => {
      state.itemsPricebeforeDiscount = addDecimals(
        state.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
      );
    
      state.itemsPriceAfterDiscount = addDecimals(
        state.cartItems.reduce((acc, item) => acc + (item.price * (1 - item.discount / 100)) * item.qty, 0)
      );
    
      state.shippingPrice = addDecimals(state.itemsPriceAfterDiscount > 100 ? 0 : 10);
      state.taxPrice = addDecimals(Number((0.15 * state.itemsPriceAfterDiscount).toFixed(2)));
    
      state.totalPrice = (
        Number(state.itemsPriceAfterDiscount) +
        Number(state.shippingPrice) +
        Number(state.taxPrice)
      ).toFixed(2);
    
      const storedUser = JSON.parse(localStorage.getItem("userInfo"));
      const loggedInUserId = storedUser?.data?.user._id; // Extract user ID safely

      if (loggedInUserId) {
        const allCarts = JSON.parse(localStorage.getItem("carts")) || {}; // Get all carts
        allCarts[loggedInUserId] = state; // Update only the logged-in user's cart
        localStorage.setItem("carts", JSON.stringify(allCarts)); // Save back all carts
      }
    
      return state;
    };
    