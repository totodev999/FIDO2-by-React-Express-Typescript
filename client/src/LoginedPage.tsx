import axios from "axios";
import { useEffect, useState } from "react";

export const LoginedPage = () => {
  const [user, setUser] = useState();
  useEffect(() => {
    axios
      .get("/api/login-user")
      .then((result) => {
        console.log(result.data);
        setUser(result.data);
      })
      .catch((err) => alert(JSON.stringify(err)));
  }, []);
  return (
    <div>
      <h2>LoginedPage</h2>
      <h3>{JSON.stringify(user)}</h3>
    </div>
  );
};
