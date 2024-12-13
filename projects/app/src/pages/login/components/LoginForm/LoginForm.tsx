import React, { useState, Dispatch, useCallback, useEffect, useRef } from 'react';
import {
  FormControl,
  Flex,
  Input,
  Button,
  Box,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  Center,
  Spinner,
  Text
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { postLogin } from '@/web/support/user/api';
import type { ResLogin } from '@/global/support/api/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getDocPath } from '@/web/common/system/doc';
import { useTranslation } from 'next-i18next';
import FormLayout from './components/FormLayout';
import { useRouter } from 'next/router';

interface Props {
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
  loginSuccess: (e: ResLogin) => void;
}

interface LoginFormType {
  username: string;
  password: string;
}

// 解密 token
const decryptToken = (token: string) => {
  try {
    // base64 解码
    const decoded = atob(token);
    // 解析 JSON
    const { username, password, timestamp } = JSON.parse(decoded);

    // 验证时间戳是否在10分钟内
    const now = Date.now();
    if (now - timestamp > 10 * 60 * 1000) {
      return null;
    }

    return { username, password };
  } catch (error) {
    console.error('Token 解析失败:', error);
    return null;
  }
};

const LoginForm = ({ setPageType, loginSuccess }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { feConfigs } = useSystemStore();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormType>();

  const [requesting, setRequesting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const loginCallbackRef = useRef<((response: ResLogin) => void) | null>(null);

  const onclickLogin = useCallback(
    async ({ username, password }: LoginFormType) => {
      // 如果已经登录成功或正在请求中，直接返回
      if (isLoggedIn || requesting) return;
      setRequesting(true);

      try {
        const response = await postLogin({
          username,
          password
        });

        // 设置登录状态
        setIsLoggedIn(true);

        // 确保回调只执行一次
        if (!loginCallbackRef.current) {
          loginCallbackRef.current = loginSuccess;
          // 显示登录成功提示
          toast({
            title: '登录成功',
            status: 'success'
          });
          // 执行登录成功回调
          loginSuccess(response);
        }
      } catch (error: any) {
        setIsLoggedIn(false);
        toast({
          title: error.message || '登录失败',
          status: 'error'
        });
      } finally {
        setRequesting(false);
      }
    },
    [loginSuccess, toast, requesting, isLoggedIn]
  );

  // 自动登录逻辑
  useEffect(() => {
    const { username = '', password = '' } = router.query as {
      username?: string;
      password?: string;
    };
    // 使用 handleSubmit，但确保只在未登录时执行
    if (!isLoggedIn) {
      onclickLogin({ username, password });
    }
  }, [router.query, isLoggedIn]);

  // 组件卸载时重置状态
  useEffect(() => {
    return () => {
      setIsLoggedIn(false);
      loginCallbackRef.current = null;
    };
  }, []);

  const isCommunityVersion = !!(feConfigs?.register_method && !feConfigs?.isPlus);

  const placeholder = (() => {
    if (isCommunityVersion) {
      return '使用 root 用户登录';
    }
    return ['用户名']
      .concat(
        feConfigs?.login_method?.map((item) => {
          switch (item) {
            case 'email':
              return '邮箱';
            case 'phone':
              return '手机号';
          }
        }) ?? []
      )
      .join('/');
  })();

  return (
    <>
      <FormLayout setPageType={setPageType} pageType={LoginPageTypeEnum.passwordLogin}>
        <Box
          mt={'42px'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !requesting && !isLoggedIn) {
              handleSubmit(onclickLogin)();
            }
          }}
        >
          <FormControl isInvalid={!!errors.username}>
            <Input
              bg={'myGray.50'}
              placeholder={placeholder}
              {...register('username', {
                required: true
              })}
            ></Input>
          </FormControl>
          <FormControl mt={6} isInvalid={!!errors.password}>
            <Input
              bg={'myGray.50'}
              type={'password'}
              placeholder={
                isCommunityVersion ? 'root 用户密码为环境变量 DEFAULT_ROOT_PSW 的值' : '密码'
              }
              {...register('password', {
                required: true,
                maxLength: {
                  value: 60,
                  message: '密码最多 60 位'
                }
              })}
            ></Input>
          </FormControl>
          {feConfigs?.docUrl && (
            <Flex alignItems={'center'} mt={7} fontSize={'mini'}>
              使用即代表你同意我们的
              <Link
                ml={1}
                href={getDocPath('/docs/agreement/terms/')}
                target={'_blank'}
                color={'primary.500'}
              >
                服务协议
              </Link>
              <Box mx={1}>&</Box>
              <Link
                href={getDocPath('/docs/agreement/privacy/')}
                target={'_blank'}
                color={'primary.500'}
              >
                隐私协议
              </Link>
            </Flex>
          )}
          <Button
            type="submit"
            my={6}
            w={'100%'}
            size={['md', 'md']}
            colorScheme="blue"
            isLoading={requesting}
            onClick={handleSubmit(onclickLogin)}
            disabled={requesting || isLoggedIn}
          >
            登录
          </Button>

          <Flex align={'center'} justifyContent={'flex-end'} color={'primary.700'}>
            {feConfigs?.find_password_method && feConfigs.find_password_method.length > 0 && (
              <Box
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('forgetPassword')}
                fontSize="sm"
              >
                忘记密码?
              </Box>
            )}
            {feConfigs?.register_method && feConfigs.register_method.length > 0 && (
              <>
                <Box mx={3} h={'16px'} w={'1.5px'} bg={'myGray.250'}></Box>
                <Box
                  cursor={'pointer'}
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => setPageType('register')}
                  fontSize="sm"
                >
                  注册账号
                </Box>
              </>
            )}
          </Flex>
        </Box>
      </FormLayout>

      {/* 登录中的全屏提示 */}
      <Modal isOpen={requesting} onClose={() => {}} closeOnOverlayClick={false} isCentered>
        <ModalOverlay
          bg="rgba(255, 255, 255, 0.8)"
          backdropFilter="blur(4px)"
          style={{
            background:
              'linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(240, 240, 255, 0.9))'
          }}
        />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          maxW="300px"
          p={6}
          borderRadius="lg"
          position="relative"
        >
          <Center
            flexDirection="column"
            bg="white"
            p={8}
            borderRadius="lg"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)"
          >
            <Spinner
              size="xl"
              color="primary.500"
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.100"
            />
            <Text mt={6} fontSize="lg" fontWeight="500" color="gray.700" textAlign="center">
              正在登录中...
            </Text>
          </Center>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LoginForm;
