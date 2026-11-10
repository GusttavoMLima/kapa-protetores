ALTER TABLE "tb_adoptions"
ADD COLUMN "signedContractData" BYTEA,
ADD COLUMN "signedContractFileName" TEXT,
ADD COLUMN "signedContractUploadedAt" TIMESTAMP(3);
