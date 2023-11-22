import { Link } from "react-router-dom";
import "./App.css";
import { useEffect, useRef } from "react";
import { decodeBase64URL, encodeBase64URL } from "./lib/base64URL";
import axios from "axios";

// パスキーの自動フォーム
// https://web.dev/articles/passkey-form-autofill?hl=ja#authenticate_with_a_passkey_through_form_autofill
function Login() {
  const isFirstRef = useRef(true);
  const fido2Login = async (
    mediation: CredentialMediationRequirement = "conditional"
  ) => {
    try {
      const challenge = (await axios.post("/api/login/public-key/challenge"))
        .data;
      console.log("challenge", challenge.challenge);
      // SimpleWebAuthn/clientを参照すると型は独自で定義していそう。一旦anyで逃げる
      // https://github.com/MasterKale/SimpleWebAuthn/tree/master/packages/browser/src
      // https://github.com/MasterKale/SimpleWebAuthn/blob/5229cebbcc2d087b7eaaaeb9886f53c9e1d93522/packages/typescript-types/src/index.ts#L124
      const credential = (await navigator.credentials.get({
        mediation,
        publicKey: {
          challenge: decodeBase64URL(challenge.challenge),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;
      console.log("credential", credential);
      if (!credential) {
        return alert("認証情報がないです");
      }

      const { clientDataJSON, authenticatorData, signature, userHandle } =
        credential?.response ?? {};

      console.log(
        "検証用:clientDataJSON, authenticatorData, signature, userHandle",
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle
      );

      const body = {
        id: credential.id,
        response: {
          clientDataJSON: encodeBase64URL(clientDataJSON),
          authenticatorData: encodeBase64URL(authenticatorData),
          signature: encodeBase64URL(signature),
          userHandle: userHandle ? encodeBase64URL(userHandle) : null,
          authenticatorAttachment: credential.authenticatorAttachment,
        },
      };
      console.log("body", body);
      if (credential.authenticatorAttachment) {
        delete body.response.authenticatorAttachment;
      }
      const { location } = (await axios.post("/api/login/public-key", body))
        .data;
      window.location.href = location;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err instanceof Error) {
        switch (err.name) {
          case "NotAllowedError":
            return alert("端末に指定された認証を実施してください");
        }
      }
      console.log(err);
      alert(`エラーです${err}`);
    }
  };
  // Conditional UIが使える場合はConditional UIを使用そうでない場合はSign in with Touch IDをクリック
  // ※後者（Sign in with Touch IDをクリック）は多分あまりいいUXではない。以下のURLがわかりやすかった
  // https://moneyforward-dev.jp/entry/2023/04/05/134721
  useEffect(() => {
    if (!isFirstRef.current) return;
    isFirstRef.current = false;
    if (
      window.PublicKeyCredential &&
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      PublicKeyCredential.isConditionalMediationAvailable().then(function (
        available
      ) {
        console.log("自動でサインイン オプションが使用可能か", available);

        if (!available) {
          document.getElementById("siw-public-key")?.click();
          return;
        }

        fido2Login();
      });
    }
  }, []);

  const onClickTouchID = async (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (!window.PublicKeyCredential) {
      alert("Passkeys are not supported by this browser");
      return;
    }
    event.preventDefault();
    await fido2Login("silent");
  };
  return (
    <div>
      <h2>Login</h2>
      <form>
        <section>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="webauthn"
            required
            autoFocus
          />
        </section>
        {/* <button type="submit">Sign in</button> */}
      </form>
      <a id="siw-public-key" onClick={(e) => onClickTouchID(e)}>
        Sign in with Touch ID
      </a>

      <p>
        アカウントをお持ちでない場合は<Link to="/signup">sign up</Link>画面へ
      </p>
    </div>
  );
}

export default Login;
