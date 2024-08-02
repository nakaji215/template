'use client';

import { app, auth } from "@/framework/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const doLogin = async (email: string, password: string) => {
    setEmailError("");
    setPasswordError("");
    setLoginError("");

    if (!email || !password) {
      setLoginError("メールアドレスとパスワードを入力してください。");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(`ログイン成功: ${user.email}`);
      router.push('/dashboard');
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorCode = error.code;

        switch (errorCode) {
          case 'auth/invalid-email':
            setEmailError("メールアドレスの形式が正しくありません。");
            break;
          case 'auth/user-not-found':
            setEmailError("ユーザーが見つかりません。");
            break;
          case 'auth/wrong-password':
            setPasswordError("パスワードが間違っています。");
            break;
          case 'auth/too-many-requests':
            setLoginError("試行回数が多すぎます。後でもう一度試してください。");
            break;
          default:
            setLoginError("ログインに失敗しました。エラーコード: " + errorCode);
        }
      } else {
        setLoginError("ログイン中に予期しないエラーが発生しました。");
      }
    }
  };

  const doSignup = async (email: string, password: string) => {
    setEmailError("");
    setPasswordError("");
    setLoginError("");

    if (!email || !password) {
      setLoginError("メールアドレスとパスワードを入力してください。");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert(`${user.email} さんを登録しました！`);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorCode = error.code;

        switch (errorCode) {
          case 'auth/email-already-in-use':
            setEmailError("このメールアドレスは既に登録されています。");
            break;
          case 'auth/invalid-email':
            setEmailError("メールアドレスの形式が正しくありません。");
            break;
          case 'auth/weak-password':
            setPasswordError("パスワードは6文字以上である必要があります。");
            break;
          default:
            setLoginError("登録に失敗しました。エラーコード: " + errorCode);
        }
      } else {
        setLoginError("登録中に予期しないエラーが発生しました。");
      }
    }
  };

  return (
    <div className="bg-slate-600 w-screen h-screen flex justify-center items-center">
      <div className="w-full max-w-xs">
        <form className="bg-slate-200 shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              E-mail
            </label>
            <input
              className={`shadow appearance-none border ${emailError ? 'border-red-500' : ''} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              id="email"
              type="text"
              placeholder="example@example.com"
              value={email}
              onChange={handleChangeEmail}
            />
            {emailError && (
              <p className="text-red-500 text-xs italic mt-2">{emailError}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className={`shadow appearance-none border ${passwordError ? 'border-red-500' : ''} rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline`}
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={handleChangePassword}
            />
            {passwordError && (
              <p className="text-red-500 text-xs italic mt-2">{passwordError}</p>
            )}
          </div>

          {loginError && (
            <p className="text-red-500 text-xs italic mb-4">{loginError}</p>
          )}

          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => doLogin(email, password)}
            >
              Log In
            </button>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => doSignup(email, password)}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
