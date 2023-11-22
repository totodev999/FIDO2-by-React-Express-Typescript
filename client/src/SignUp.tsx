import axios from "axios";
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { decodeBase64URL, encodeBase64URL } from "./lib/base64URL";

export const SignUp = () => {
  const pageNavigator = useNavigate();
  const onSubmitSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const fetchChallege = await axios.post(
        "/api/signup/public-key/challenge",
        {
          name: form.get("name"),
          username: form.get("username"),
          test: form.get("test"),
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("検証用:fetchChallegeJson", fetchChallege);

      const fetchChallegeJson = fetchChallege.data;

      // SimpleWebAuthn/clientを参照すると型は独自で定義していそう。一旦anyで逃げる
      // https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/browser/src/methods/startRegistration.ts
      // https://github.com/MasterKale/SimpleWebAuthn/blob/5229cebbcc2d087b7eaaaeb9886f53c9e1d93522/packages/typescript-types/src/index.ts#L102
      const publicKeyCredential = (await navigator.credentials.create({
        publicKey: {
          rp: {
            name: "FIDO2 TEST APP",
          },
          // 項目を追加できるかを確認（本来id,name,displayNameのみ。）→無理やり型を変換すればいけた
          user: {
            id: decodeBase64URL(fetchChallegeJson.user.id),
            name: fetchChallegeJson.user.name,
            displayName: fetchChallegeJson.user.displayName,
            test: fetchChallegeJson.user.test,
          } as unknown as PublicKeyCredentialUserEntity,
          challenge: decodeBase64URL(fetchChallegeJson.challenge),
          pubKeyCredParams: [
            {
              type: "public-key",
              alg: -7, // ES256
            },
            {
              type: "public-key",
              alg: -257, // RS256
            },
          ],
          // https://developer.mozilla.org/ja/docs/Web/API/CredentialsContainer/create#%E3%82%A6%E3%82%A7%E3%83%96%E8%AA%8D%E8%A8%BC_api
          //attestation: 'none',
          // https://developer.mozilla.org/ja/docs/Web/API/CredentialsContainer/create#authenticatorselection
          authenticatorSelection: {
            // 利用可能な認証機を指定するoption(platformはplatformの機能、cross-platformはUSBなど)
            //authenticatorAttachment: 'platform', // "platform" | "cross-platform"

            // userIdなども不要にするための機能（認証器がユーザーの情報を保存するらしく、要は指紋認証だけでログインができる感じらしい。まだそこまで普及していない？（未検証）
            //residentKey: 'discouraged', // "discouraged" | "preferred" | "required"

            // 上記を有効化するオプションです。
            //requireResidentKey: false, // true | false (default)

            // ユーザー認証の要否の設定 discouragedにしても認証求められる。。。真偽は不明だがこのサイトの内容か？（https://blog.haniyama.com/2018/10/19/webauthn-residentkey/）
            // required: userVerificationが必須で、検証に失敗した場合は認証ができない。
            // preferred: userVerificationが望ましいが、検証に失敗しても認証ができる。
            // discouraged: userVerificationが不要で、認証器がサポートしていなくても認証ができる
            userVerification: "preferred", // "required" | "preferred" (default) | "discouraged"
          },
          //extensions: {
          //  credProps: true
          //}
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;
      const { clientDataJSON, attestationObject } =
        (publicKeyCredential?.response as AuthenticatorAttestationResponse) ??
        {};
      const body = {
        response: {
          clientDataJSON: encodeBase64URL(clientDataJSON),
          attestationObject: encodeBase64URL(attestationObject),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transports: (publicKeyCredential?.response as any)?.getTransports(),
        },
      };
      // USBなどの外部認証機器を使用した場合に使用？
      if (!body.response.transports) {
        delete body.response.transports;
      }
      await axios
        .post("/api/login/public-key", JSON.stringify(body), {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
        .then(() => {
          pageNavigator("/logined-page");
        });
    } catch (err) {
      alert(JSON.stringify(err));
    }
  };

  useEffect(() => {}, []);

  return (
    <div>
      <h2>SignUp</h2>
      <form onSubmit={(data) => onSubmitSignup(data)}>
        <section>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required />
        </section>
        <section>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" required />
        </section>
        <section>
          <label htmlFor="test">test</label>
          <input id="test" name="test" type="text" required />
        </section>
        <button type="submit">Sign up</button>
      </form>
      <p>
        すでにアカウントをお持ちの場合<Link to="/login">login</Link>
      </p>
    </div>
  );
};
