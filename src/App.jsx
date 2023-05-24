import "./styles/App.css"
import React, { useEffect, useState } from "react"
import { ethers } from "ethers"
import myEpicNft from "./utils/MyEpicNFT.json"
import { TailSpin } from 'react-loader-spinner'

// Constants
const TOTAL_MINT_COUNT = 1000

const CONTRACT_ADDRESS = "0x28e6571c0E8EaC05E024A5E3514bE73Cda53DeD6";
const OPENSEA_LINK = "https://testnets.opensea.io/assets/mumbai/" + CONTRACT_ADDRESS

const App = () => {

  /*
   * Só uma variável de estado que usamos pra armazenar nossa carteira pública. Não esqueça de importar o useState.
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalMintedNFT, setTotalMintedNFT] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountOwner, setIsAccountOwner] = useState(false);
  const [ownerTokenId, setOwnerTokenId] = useState(-1);

  /*
   * Precisamos ter certeza que isso é assíncrono.
   */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Certifique-se que você tem a MetaMask instalada!")
      return;
    } else {
      console.log("Temos o objeto ethereum!", ethereum)
    }
    /*
     * Checa se estamos autorizados a carteira do usuário.
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });
    /*
     * Usuário pode ter múltiplas carteiras autorizadas, nós podemos pegar a primeira que está lá!
     */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Encontrou uma conta autorizada:", account);
      setCurrentAccount(account);
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Conectado à rede " + chainId);
      // String, hex code of the chainId of the Rinkebey test network
      const mumbaiChainId = "0x13881";
      if (chainId !== mumbaiChainId) {
        alert("Você não está conectado a rede Mumbai de teste!");
      }
      setupEventListener()
    } else {
      console.log("Nenhuma conta autorizada foi encontrada");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Baixe a MetaMask!");
        return;
      }
      /*
       * Método chique para pedir acesso a conta.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      /*
       * Boom! Isso deve escrever o endereço público uma vez que autorizar a MetaMask.
       */
      console.log("Conectado", accounts[0]);
      setCurrentAccount(accounts[0]);
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Conectado à rede " + chainId);
      // String, hex code of the chainId of the Rinkebey test network
      const mumbaiChainId = "0x13881";
      if (chainId !== mumbaiChainId) {
        alert("Você não está conectado a rede Mumbai de teste!");
      }
      setupEventListener()
    } catch (error) {
      console.log(error);
    }
  };

  const setupEventListener = async () => {
    // é bem parecido com a função
    try {
      const { ethereum } = window

      if (ethereum) {
        // mesma coisa de novo
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)

        // Aqui está o tempero mágico.
        // Isso essencialmente captura nosso evento quando o contrato lança
        // Se você está familiar com webhooks, é bem parecido!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(
            `Olá pessoal! Já cunhamos seu NFT. Pode ser que esteja branco agora. Demora no máximo 10 minutos para aparecer no OpenSea. Aqui está o link: <https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`
          )
        })

        console.log("Setup event listener!")
      } else {
        console.log("Objeto ethereum não existe!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Vai abrir a carteira agora para pagar o gás...");
        let nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Cunhando...espere por favor.");
        setIsLoading(true);
        await nftTxn.wait();
        console.log(
          `Cunhado, veja a transação: https://mumbai.polygonscan.com/tx/${nftTxn.hash}`
        );
        setIsLoading(false);
        updateTotalMintedNFT();
      } else {
        console.log("Objeto ethereum não existe!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const showOpenSeaCollection = () => {
    window.open(OPENSEA_LINK);
  }

  const showTokenOpenSea = () => {
    window.open(OPENSEA_LINK + "/" + ownerTokenId);
  };

  const updateTotalMintedNFT = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)
      let mintedNft = await connectedContract.getTotalNFTsMintedSoFar();
      setTotalMintedNFT(mintedNft);
    }
  }

  const checkOwnership = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer)
      let hasNft = await connectedContract.isOwner(signer.getAddress());
      setIsAccountOwner(hasNft);
      if (hasNft) {
        let tokenId = await connectedContract.getOwnerToken(signer.getAddress());
        setOwnerTokenId(tokenId);
      }
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button fire-button">Conectar Carteira</button>
  )

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  useEffect(() => {
    updateTotalMintedNFT();
  }, [])
  useEffect(() => {
    checkOwnership();
  }, [])
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text"> Crie Seu Charmander Shiny! </p>
          <p className="sub-text">
            Conecte sua carteira e receba um Charmander 100% único!
          </p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <div>
              {isLoading ? (
                <TailSpin
                  height="80"
                  width="80"
                  color="#ff6c00"
                  ariaLabel="tail-spin-loading"
                  radius="1"
                  wrapperStyle={{ justifyContent: "center" }}
                  wrapperClass=""
                  visible={true}
                />
              ) : (
                <div>
                  {!isAccountOwner ? (
                    <button onClick={askContractToMintNft} className="cta-button fire-button">
                      Gere meu Charmander!
                    </button>
                  ) : (
                    <button onClick={showTokenOpenSea} className="cta-button opensea-button">
                      Veja seu Charmander!
                    </button>
                  )};
                </div>
              )}
              <br />
              <button onClick={showOpenSeaCollection} className="cta-button opensea-button">
                🔥 Veja a coleção na OpenSea 🔥
              </button>
            </div>
          )}
        </div>
        {currentAccount === "" ? (
          <div className="footer-container">
            <h6
              className="footer-text"
            >{"Conecte sua carteira para ver quantos Charmanders foram gerados até agora."}</h6>
          </div>
        ) : (
          <div className="footer-container">
            <h6
              className="footer-text"
            >{`${totalMintedNFT}/${TOTAL_MINT_COUNT} Charmanders gerados até agora.`}</h6>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
