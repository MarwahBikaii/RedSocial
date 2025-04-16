import { apiSlice } from "./apiSlice";
import { USERS_URL } from "../constants";

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      login: builder.mutation({
        query: (data) => ({
          url: `${USERS_URL}/auth`,  //http:locahost:3000/api/users/auth
          method: "POST",
          body: data,
        }),
    }),

        logout: builder.mutation({
            query: () => ({
              url: `${USERS_URL}/logout`,
              method: "POST",
            }),
          }),

      })  
    });

    //'use${Login}mutation'

    export const {useLoginMutation,useLogoutMutation}=userApiSlice