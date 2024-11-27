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
  const autoLoginRef = useRef(false);
  const loginSuccessRef = useRef(false);

  const onclickLogin = useCallback(
    async ({ username, password }: LoginFormType) => {
      if (requesting || loginSuccessRef.current) return;
      setRequesting(true);

      try {
        const response = await postLogin({
          username,
          password
        });

        // 只在首次登录成功时显示提示
        if (!loginSuccessRef.current) {
          loginSuccessRef.current = true;
          toast({
            title: '登录成功',
            status: 'success'
          });
          loginSuccess(response);
        }
      } catch (error: any) {
        toast({
          title: error.message || '登录失败',
          status: 'error'
        });
        loginSuccessRef.current = false;
      }
      setRequesting(false);
    },
    [loginSuccess, toast, requesting]
  );

  // 自动填充用户名和密码并登录
  useEffect(() => {
    const { token } = router.query;

    // 防止重复自动登录
    if (autoLoginRef.current || !token || loginSuccessRef.current) return;

    const credentials = decryptToken(token as string);
    if (!credentials) {
      toast({
        title: '登录链接已过期或无效',
        status: 'error'
      });
      return;
    }

    const { username, password } = credentials;
    setValue('username', username);
    setValue('password', password);

    // 标记已经触发过自动登录
    autoLoginRef.current = true;

    // 延迟一下自动登录，等待表单状态更新
    setTimeout(() => {
      if (!requesting && !loginSuccessRef.current) {
        handleSubmit(onclickLogin)();
      }
    }, 100);
  }, [router.query, setValue, handleSubmit, onclickLogin, requesting, toast]);

  // 组件卸载时重置状态
  useEffect(() => {
    return () => {
      autoLoginRef.current = false;
      loginSuccessRef.current = false;
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
            if (e.key === 'Enter' && !e.shiftKey && !requesting && !loginSuccessRef.current) {
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
            disabled={requesting || loginSuccessRef.current}
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
